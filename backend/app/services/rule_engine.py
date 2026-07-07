"""规则引擎 — 5 类异常检测"""

from typing import List

from app.config import get_settings
from app.schemas import (
    AdvertisingRecord,
    InventoryRecord,
    Issue,
    IssueType,
    ReviewRecord,
    SalesRecord,
    Severity,
)


class RuleEngine:
    """运营异常检测规则引擎"""

    def run_all(
        self,
        adv_data: List[AdvertisingRecord],
        inv_data: List[InventoryRecord],
        rev_data: List[ReviewRecord],
        sales_data: List[SalesRecord],
    ) -> List[Issue]:
        """运行全部规则，返回按严重度排序的问题列表"""
        settings = get_settings()
        issues: List[Issue] = []

        issues += self.check_inventory_low_stock(inv_data, settings.inventory_low_stock_days)
        issues += self.check_ad_waste(adv_data, settings.ad_waste_min_spend)
        issues += self.check_keyword_low_conversion(adv_data, settings.keyword_low_conv_min_clicks)
        issues += self.check_negative_reviews(rev_data, settings.negative_review_max_rating)
        issues += self.check_conversion_drop(sales_data, settings.conversion_drop_threshold)

        # 按严重度排序：HIGH > MEDIUM > LOW
        severity_order = {Severity.HIGH: 0, Severity.MEDIUM: 1, Severity.LOW: 2}
        issues.sort(key=lambda x: severity_order.get(x.severity, 99))
        return issues

    # ---- 规则 1: 库存预警 ----

    def check_inventory_low_stock(
        self, data: List[InventoryRecord], threshold_days: float
    ) -> List[Issue]:
        """库存天数低于阈值 → 立即补货或降低广告预算"""
        issues = []
        for item in data:
            if item.days_of_supply <= 0:
                continue
            if item.days_of_supply < threshold_days:
                # 库存极少（< 阈值的一半）→ HIGH，否则 MEDIUM
                severity = Severity.HIGH if item.days_of_supply < threshold_days / 2 else Severity.MEDIUM
                action = (
                    f"库存仅够 {item.days_of_supply:.0f} 天，建议立即补货"
                    if item.inbound_qty == 0
                    else f"库存仅够 {item.days_of_supply:.0f} 天，已有 {item.inbound_qty} 件在途，建议降低广告预算"
                )
                issues.append(Issue(
                    type=IssueType.INVENTORY_LOW_STOCK,
                    severity=severity,
                    sku=item.sku,
                    target=item.product_name,
                    description=(
                        f"{item.product_name} ({item.sku}) 库存仅剩 {item.fba_in_stock} 件，"
                        f"日均销量 {item.daily_sales_avg:.1f}，可售天数 {item.days_of_supply:.0f} 天"
                    ),
                    recommended_action=action,
                    raw_data={
                        "sku": item.sku,
                        "fba_in_stock": item.fba_in_stock,
                        "daily_sales_avg": item.daily_sales_avg,
                        "days_of_supply": item.days_of_supply,
                        "inbound_qty": item.inbound_qty,
                    },
                ))
        return issues

    # ---- 规则 2: 广告无效花费 ----

    def check_ad_waste(
        self, data: List[AdvertisingRecord], min_spend: float
    ) -> List[Issue]:
        """花费超过阈值但 0 订单 → 否词或降竞价"""
        issues = []
        for item in data:
            if item.spend >= min_spend and item.orders == 0:
                severity = Severity.HIGH if item.spend >= min_spend * 3 else Severity.MEDIUM
                issues.append(Issue(
                    type=IssueType.AD_WASTE,
                    severity=severity,
                    sku=item.campaign_name,
                    target=item.keyword,
                    description=(
                        f"{item.campaign_name} 关键词 \"{item.keyword}\" 昨日花费 ${item.spend:.2f}，"
                        f"点击 {item.clicks} 次，但 0 订单"
                    ),
                    recommended_action=(
                        f"建议检查搜索词报告，添加否定关键词或降低 \"{item.keyword}\" 的竞价，"
                        f"避免持续无效花费"
                    ),
                    raw_data={
                        "campaign_name": item.campaign_name,
                        "keyword": item.keyword,
                        "spend": item.spend,
                        "clicks": item.clicks,
                        "orders": item.orders,
                        "acos": item.acos,
                    },
                ))
        return issues

    # ---- 规则 3: 关键词低转化 ----

    def check_keyword_low_conversion(
        self, data: List[AdvertisingRecord], min_clicks: int
    ) -> List[Issue]:
        """点击次数超过阈值但 0 订单 → 加入观察列表"""
        issues = []
        for item in data:
            # 已经被 ad_waste 规则捕获的跳过（spend >= min_spend 且 orders == 0）
            settings = get_settings()
            if item.orders == 0 and item.clicks >= min_clicks:
                if item.spend >= settings.ad_waste_min_spend:
                    continue  # 已被广告无效花费规则覆盖
                severity = Severity.LOW
                issues.append(Issue(
                    type=IssueType.KEYWORD_LOW_CONVERSION,
                    severity=severity,
                    sku=item.campaign_name,
                    target=item.keyword,
                    description=(
                        f"关键词 \"{item.keyword}\" 点击 {item.clicks} 次无转化，"
                        f"花费 ${item.spend:.2f}，展示 {item.impressions} 次"
                    ),
                    recommended_action=(
                        f"建议将 \"{item.keyword}\" 加入观察列表，"
                        f"持续监控 3-5 天，若无改善则考虑暂停或调整匹配方式"
                    ),
                    raw_data={
                        "campaign_name": item.campaign_name,
                        "keyword": item.keyword,
                        "clicks": item.clicks,
                        "spend": item.spend,
                        "impressions": item.impressions,
                        "orders": item.orders,
                    },
                ))
        return issues

    # ---- 规则 4: 差评归因 ----

    def check_negative_reviews(
        self, data: List[ReviewRecord], max_rating: int
    ) -> List[Issue]:
        """评分低于等于阈值 → 分析评论内容"""
        issues = []
        # 按 SKU 聚合差评
        sku_reviews: dict[str, list[ReviewRecord]] = {}
        for item in data:
            if item.rating <= max_rating:
                sku_reviews.setdefault(item.sku, []).append(item)

        for sku, reviews in sku_reviews.items():
            worst = min(reviews, key=lambda r: r.rating)
            severity = Severity.HIGH if worst.rating <= 1 else Severity.MEDIUM
            # 提取评论关键词用于建议
            review_summary = "; ".join(f"{r.title}({r.rating}星)" for r in reviews)
            issues.append(Issue(
                type=IssueType.NEGATIVE_REVIEW,
                severity=severity,
                sku=sku,
                target=reviews[0].product_name,
                description=(
                    f"{reviews[0].product_name} ({sku}) 收到 {len(reviews)} 条差评：{review_summary}"
                ),
                recommended_action=self._generate_review_action(reviews),
                raw_data={
                    "sku": sku,
                    "product_name": reviews[0].product_name,
                    "reviews": [
                        {"review_id": r.review_id, "rating": r.rating, "title": r.title, "body": r.body}
                        for r in reviews
                    ],
                },
            ))
        return issues

    def _generate_review_action(self, reviews: list[ReviewRecord]) -> str:
        """根据评论内容生成建议"""
        all_text = " ".join(r.body.lower() for r in reviews)
        if "packag" in all_text or "box" in all_text or "damaged" in all_text:
            return "评论提到包装/破损问题，建议检查 FBA 入仓批次和包装材料，联系亚马逊调查物流损坏"
        if "stopped working" in all_text or "broke" in all_text or "died" in all_text:
            return "评论提到产品质量/故障问题，建议检查品控流程，排查该批次是否存在质量缺陷"
        if "wobbly" in all_text or "flimsy" in all_text or "sturdy" in all_text:
            return "评论提到产品稳固性问题，建议优化产品设计或材料，考虑迭代升级"
        return "建议仔细阅读差评内容，定位核心问题（质量/包装/描述不符等），制定改进方案"

    # ---- 规则 5: 转化率骤降 ----

    def check_conversion_drop(
        self, data: List[SalesRecord], threshold_pct: float
    ) -> List[Issue]:
        """转化率较 7 日均值下降超过阈值 → 检查价格/Buy Box/竞品"""
        issues = []
        for item in data:
            if item.cr_change_pct <= threshold_pct:
                severity = Severity.HIGH if item.cr_change_pct <= threshold_pct * 1.5 else Severity.MEDIUM
                issues.append(Issue(
                    type=IssueType.CONVERSION_DROP,
                    severity=severity,
                    sku=item.sku,
                    target=item.product_name,
                    description=(
                        f"{item.product_name} ({item.sku}) 转化率 {item.conversion_rate:.2f}%，"
                        f"较 7 日均值 {item.cr_7d_avg:.2f}% 下降 {abs(item.cr_change_pct):.1f}%"
                    ),
                    recommended_action=(
                        f"建议检查：1) Buy Box 是否丢失；2) 价格是否被竞品 undercut；"
                        f"3) 是否有差评影响；4) Listing 内容是否被篡改"
                    ),
                    raw_data={
                        "sku": item.sku,
                        "conversion_rate": item.conversion_rate,
                        "cr_7d_avg": item.cr_7d_avg,
                        "cr_change_pct": item.cr_change_pct,
                        "buy_box_price": item.buy_box_price,
                        "sessions": item.sessions,
                    },
                ))
        return issues
