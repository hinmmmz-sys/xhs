"""经营概览服务 — 生成经营指标、趋势图、渠道详情数据"""

import random
from datetime import datetime, timedelta
from typing import Dict

from app.schemas import (
    AdPerformanceRow,
    AnomalyAlert,
    BusinessOverview,
    ChannelBreakdownItem,
    ChannelDetail,
    MetricWithComparison,
    TopSKU,
    TrendDataPoint,
)


# ---- Mock 数据池 ----

_PRODUCT_NAMES = [
    ("SKU-001", "无线蓝牙耳机 Pro Max"),
    ("SKU-002", "智能运动手环 S9"),
    ("SKU-003", "便携式榨汁机 300W"),
    ("SKU-004", "LED 智能台灯 RGB"),
    ("SKU-005", "防水背包 35L"),
    ("SKU-006", "纳米防水喷雾 200ml"),
    ("SKU-007", "手机支架重力感应"),
    ("SKU-008", "保温杯 316不锈钢 500ml"),
    ("SKU-009", "车载手机无线充电器"),
    ("SKU-010", "瑜伽垫 TPE 6mm"),
]

_AD_CAMPAIGNS = [
    ("自动广告- broad match", "wireless earbuds"),
    ("手动广告-精确匹配", "bluetooth headphone pro"),
    ("品牌广告-品牌词", "brand store"),
    ("展示广告-再营销", "retargeting banner"),
    ("视频广告-头条", "product showcase video"),
    ("自动广告-品类词", "smart fitness tracker"),
    ("手动广告-长尾词", "portable juicer 300w"),
    ("品牌广告-竞品词", "competitor brand keyword"),
]

_CHANNELS = [
    ("自然搜索", 0.35),
    ("广告投放", 0.25),
    ("直播自营", 0.18),
    ("短视频自营", 0.12),
    ("站外引流", 0.10),
]


# 日期周期配置
DATE_RANGES = {
    "realtime": {"label": "实时", "days": 1, "trend_points": 24},  # 按小时
    "1d": {"label": "近1天", "days": 1, "trend_points": 1},
    "7d": {"label": "近7天", "days": 7, "trend_points": 7},
    "30d": {"label": "近30天", "days": 30, "trend_points": 30},
}


def _calc_change(current: float, previous: float) -> float:
    """计算变化百分比"""
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round((current - previous) / previous * 100, 1)


def _make_metric(label: str, current: float, previous: float, unit: str) -> MetricWithComparison:
    """构造带对比的指标"""
    change = _calc_change(current, previous)
    trend = "up" if change > 0 else ("down" if change < 0 else "flat")
    return MetricWithComparison(
        label=label,
        current=round(current, 2),
        previous=round(previous, 2),
        change_pct=change,
        unit=unit,
        trend=trend,
    )


def _make_channel(name: str, base_scale: float, period_days: int) -> ChannelDetail:
    """构造渠道详情"""
    factor = period_days if period_days > 1 else 1
    noise = random.uniform(0.85, 1.15)

    exposure_cur = int(12000 * base_scale * factor * noise)
    exposure_prev = int(12000 * base_scale * factor * random.uniform(0.9, 1.05))

    clicks_cur = int(exposure_cur * random.uniform(0.03, 0.06))
    clicks_prev = int(exposure_prev * random.uniform(0.03, 0.06))

    payment_cur = round(clicks_cur * random.uniform(15, 35), 2)
    payment_prev = round(clicks_prev * random.uniform(15, 35), 2)

    orders_cur = int(payment_cur / random.uniform(80, 120))
    orders_prev = int(payment_prev / random.uniform(80, 120))

    visitors_cur = int(exposure_cur * random.uniform(0.4, 0.6))
    visitors_prev = int(exposure_prev * random.uniform(0.4, 0.6))

    cpr_cur = round(clicks_cur / max(orders_cur, 1) * 100, 2) if orders_cur > 0 else 0
    cpr_prev = round(clicks_prev / max(orders_prev, 1) * 100, 2) if orders_prev > 0 else 0

    return ChannelDetail(
        name=name,
        exposure=_make_metric("曝光人数", exposure_cur, exposure_prev, "人"),
        clicks=_make_metric("点击人数", clicks_cur, clicks_prev, "人"),
        payment=_make_metric("支付金额", payment_cur, payment_prev, "元"),
        orders=_make_metric("成交订单", orders_cur, orders_prev, "单"),
        visitors=_make_metric("访客人数", visitors_cur, visitors_prev, "人"),
        click_payment_rate=_make_metric("点击支付率", cpr_cur, cpr_prev, "%"),
    )


def _generate_top_skus(factor: int) -> list[TopSKU]:
    """生成 Top 商品表"""
    skus = []
    for i, (sku, name) in enumerate(_PRODUCT_NAMES[:8], 1):
        units = int(random.randint(80, 400) * factor * random.uniform(0.5, 1.5))
        revenue = round(units * random.uniform(45, 180), 2)
        cr = round(random.uniform(1.5, 6.0), 2)
        dsupply = round(random.uniform(5, 60), 1)
        if dsupply < 15:
            status = "low"
        elif dsupply < 3:
            status = "out"
        else:
            status = "normal"
        skus.append(TopSKU(
            rank=i,
            sku=sku,
            product_name=name,
            units=units,
            revenue=revenue,
            conversion_rate=cr,
            stock_status=status,
            days_of_supply=dsupply,
        ))
    # 按收入降序排列
    skus.sort(key=lambda x: x.revenue, reverse=True)
    for idx, s in enumerate(skus, 1):
        s.rank = idx
    return skus


def _generate_ad_performance(factor: int) -> list[AdPerformanceRow]:
    """生成广告投放表现表"""
    rows = []
    for campaign, keyword in _AD_CAMPAIGNS:
        impressions = int(random.randint(2000, 15000) * factor)
        clicks = int(impressions * random.uniform(0.02, 0.08))
        spend = round(clicks * random.uniform(0.3, 1.2), 2)
        orders = int(clicks * random.uniform(0.02, 0.12)) if clicks > 0 else 0
        sales = round(orders * random.uniform(50, 150), 2)
        acos = round(spend / sales * 100, 1) if sales > 0 else 0
        roas = round(sales / spend, 2) if spend > 0 else 0

        if spend > 10 and orders == 0:
            status = "waste"
        elif clicks >= 20 and orders == 0:
            status = "low_conversion"
        elif roas >= 3.0:
            status = "profitable"
        else:
            status = "normal"

        rows.append(AdPerformanceRow(
            campaign_name=campaign,
            keyword=keyword,
            impressions=impressions,
            clicks=clicks,
            spend=spend,
            sales=sales,
            orders=orders,
            acos=acos,
            roas=roas,
            status=status,
        ))
    return rows


def _generate_anomaly_alerts(
    click_pay_metric: MetricWithComparison,
    refund_metric: MetricWithComparison,
    visitor_metric: MetricWithComparison,
) -> list[AnomalyAlert]:
    """根据指标变化生成异常提示"""
    alerts = []

    if click_pay_metric.trend == "down" and click_pay_metric.change_pct <= -10:
        alerts.append(AnomalyAlert(
            level="critical",
            title="转化率下降",
            description=f"商品点击支付率下降 {abs(click_pay_metric.change_pct)}%，需排查商品详情页和价格竞争力",
            source="conversion",
        ))

    if refund_metric.trend == "up" and refund_metric.change_pct >= 15:
        alerts.append(AnomalyAlert(
            level="warning",
            title="退款金额上升",
            description=f"退款金额上升 {refund_metric.change_pct}%，建议检查产品质量和物流时效",
            source="refund",
        ))

    if visitor_metric.trend == "down" and visitor_metric.change_pct <= -10:
        alerts.append(AnomalyAlert(
            level="warning",
            title="访客下滑",
            description=f"访客人数下降 {abs(visitor_metric.change_pct)}%，主要来自自然流量渠道",
            source="traffic",
        ))

    # 固定提示: 库存预警
    alerts.append(AnomalyAlert(
        level="info",
        title="库存预警",
        description="2 个 SKU 库存不足 15 天，建议及时补货",
        source="inventory",
    ))

    # 固定提示: 广告无效花费
    alerts.append(AnomalyAlert(
        level="warning",
        title="广告无效花费",
        description="1 个广告活动花费超 $10 且 0 订单，建议暂停或调整关键词",
        source="ad",
    ))

    return alerts


def _generate_channel_breakdown(factor: int) -> list[ChannelBreakdownItem]:
    """生成渠道拆分柱状图数据"""
    items = []
    for name, share in _CHANNELS:
        visitors = int(12000 * factor * share * random.uniform(0.9, 1.1))
        orders = int(visitors * random.uniform(0.02, 0.05))
        payment = round(orders * random.uniform(80, 120), 2)
        items.append(ChannelBreakdownItem(
            name=name,
            visitors=visitors,
            payment=payment,
            orders=orders,
        ))
    return items


def _generate_trend(days: int, points: int) -> list[TrendDataPoint]:
    """生成趋势数据点"""
    trend = []
    now = datetime.now()

    if days == 1 and points == 24:
        # 实时模式：按小时生成
        for h in range(points, 0, -1):
            t = now - timedelta(hours=h)
            base_visitors = random.randint(200, 600)
            base_orders = int(base_visitors * random.uniform(0.02, 0.05))
            base_payment = round(base_orders * random.uniform(80, 120), 2)
            base_exposure = int(base_visitors * random.uniform(2, 3.5))
            trend.append(TrendDataPoint(
                date=t.strftime("%H:00"),
                payment=base_payment,
                visitors=base_visitors,
                orders=base_orders,
                exposure=base_exposure,
            ))
    else:
        # 按天生成
        step = max(days // points, 1) if points < days else 1
        actual_points = min(points, days)
        for i in range(actual_points, 0, -1):
            t = now - timedelta(days=i)
            base_visitors = random.randint(800, 2500)
            base_orders = int(base_visitors * random.uniform(0.02, 0.05))
            base_payment = round(base_orders * random.uniform(80, 120), 2)
            base_exposure = int(base_visitors * random.uniform(2, 3.5))
            trend.append(TrendDataPoint(
                date=t.strftime("%m-%d"),
                payment=base_payment,
                visitors=base_visitors,
                orders=base_orders,
                exposure=base_exposure,
            ))

    return trend


def get_business_overview(date_range: str = "7d") -> BusinessOverview:
    """
    根据日期周期生成经营概览数据。
    date_range: realtime, 1d, 7d, 30d
    """
    config = DATE_RANGES.get(date_range, DATE_RANGES["7d"])
    days = config["days"]
    points = config["trend_points"]
    factor = days if days > 1 else 1

    # 生成核心指标（current vs previous）
    noise_up = random.uniform(0.95, 1.12)
    noise_down = random.uniform(0.88, 1.05)

    total_payment_cur = round(45000 * factor * noise_up, 2)
    total_payment_prev = round(45000 * factor * noise_down, 2)

    exposure_cur = int(85000 * factor * noise_up)
    exposure_prev = int(85000 * factor * noise_down)

    click_pay_cur = round(random.uniform(2.5, 4.5), 2)
    click_pay_prev = round(click_pay_cur * random.uniform(0.9, 1.08), 2)

    refund_cur = round(3200 * factor * random.uniform(0.8, 1.3), 2)
    refund_prev = round(3200 * factor * random.uniform(0.85, 1.1), 2)

    order_cur = int(520 * factor * noise_up)
    order_prev = int(520 * factor * noise_down)

    visitor_cur = int(12000 * factor * noise_up)
    visitor_prev = int(12000 * factor * noise_down)

    fav_cart_cur = int(1800 * factor * random.uniform(0.9, 1.15))
    fav_cart_prev = int(1800 * factor * random.uniform(0.88, 1.05))

    # 扩展指标
    aov_cur = round(total_payment_cur / max(order_cur, 1), 2)
    aov_prev = round(total_payment_prev / max(order_prev, 1), 2)

    refund_rate_cur = round(refund_cur / max(total_payment_cur, 1) * 100, 2)
    refund_rate_prev = round(refund_prev / max(total_payment_prev, 1) * 100, 2)

    ad_spend = round(8500 * factor * random.uniform(0.9, 1.1), 2)
    ad_spend_prev = round(8500 * factor * random.uniform(0.88, 1.05), 2)
    ad_sales = round(ad_spend * random.uniform(2.5, 5.0), 2)
    ad_sales_prev = round(ad_spend_prev * random.uniform(2.5, 5.0), 2)
    roas_cur = round(ad_sales / max(ad_spend, 1), 2)
    roas_prev = round(ad_sales_prev / max(ad_spend_prev, 1), 2)

    new_customers = int(visitor_cur * random.uniform(0.3, 0.5))
    new_customers_prev = int(visitor_prev * random.uniform(0.3, 0.5))
    cac_cur = round(ad_spend / max(new_customers, 1), 2)
    cac_prev = round(ad_spend_prev / max(new_customers_prev, 1), 2)

    total_sku_count = 50
    stockout_count = random.randint(3, 8)
    stockout_rate_cur = round(stockout_count / total_sku_count * 100, 2)
    stockout_rate_prev = round(random.randint(2, 6) / total_sku_count * 100, 2)

    # 生成趋势
    trend = _generate_trend(days, points)

    # 生成渠道详情
    live = _make_channel("直播自营", 0.6, days)
    video = _make_channel("短视频自营", 0.4, days)

    # 生成扩展数据
    top_skus = _generate_top_skus(factor)
    ad_performance = _generate_ad_performance(factor)
    channel_breakdown = _generate_channel_breakdown(factor)

    # 构造核心指标 (用于异常提示生成)
    click_pay_metric = _make_metric("商品点击支付率", click_pay_cur, click_pay_prev, "%")
    refund_metric = _make_metric("退款金额", refund_cur, refund_prev, "元")
    visitor_metric = _make_metric("访客人数", visitor_cur, visitor_prev, "人")
    anomaly_alerts = _generate_anomaly_alerts(click_pay_metric, refund_metric, visitor_metric)

    return BusinessOverview(
        date_range=date_range,
        date_range_label=config["label"],
        # 核心指标
        total_payment=_make_metric("用户支付总金额", total_payment_cur, total_payment_prev, "元"),
        exposure_count=_make_metric("商品曝光人数", exposure_cur, exposure_prev, "人"),
        click_payment_rate=click_pay_metric,
        refund_amount=refund_metric,
        order_count=_make_metric("订单成交数", order_cur, order_prev, "单"),
        visitor_count=visitor_metric,
        favorite_cart_count=_make_metric("收藏加购", fav_cart_cur, fav_cart_prev, "次"),
        # 扩展指标
        aov=_make_metric("客单价", aov_cur, aov_prev, "元"),
        refund_rate=_make_metric("退款率", refund_rate_cur, refund_rate_prev, "%"),
        roas=_make_metric("广告回报率", roas_cur, roas_prev, ""),
        cac=_make_metric("获客成本", cac_cur, cac_prev, "元"),
        stockout_rate=_make_metric("缺货率", stockout_rate_cur, stockout_rate_prev, "%"),
        # 趋势数据
        trend=trend,
        # 渠道详情
        live_streaming=live,
        short_video=video,
        # 表格 / 明细
        top_skus=top_skus,
        ad_performance=ad_performance,
        anomaly_alerts=anomaly_alerts,
        channel_breakdown=channel_breakdown,
    )
