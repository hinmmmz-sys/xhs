"""数据模型定义 — Pydantic schemas"""

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


# ---- 枚举 ----

class IssueType(str, Enum):
    INVENTORY_LOW_STOCK = "inventory_low_stock"
    AD_WASTE = "ad_waste"
    KEYWORD_LOW_CONVERSION = "keyword_low_conversion"
    NEGATIVE_REVIEW = "negative_review"
    CONVERSION_DROP = "conversion_drop"


class Severity(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


# ---- CSV 行记录 ----

class AdvertisingRecord(BaseModel):
    date: str = ""
    campaign_name: str = ""
    campaign_id: str = ""
    keyword: str = ""
    match_type: str = ""
    impressions: int = 0
    clicks: int = 0
    spend: float = 0.0
    sales: float = 0.0
    orders: int = 0
    acos: Optional[float] = None


class InventoryRecord(BaseModel):
    sku: str = ""
    product_name: str = ""
    fba_in_stock: int = 0
    daily_sales_avg: float = 0.0
    days_of_supply: float = 0.0
    inbound_qty: int = 0
    status: str = ""


class ReviewRecord(BaseModel):
    sku: str = ""
    product_name: str = ""
    review_id: str = ""
    rating: int = 5
    title: str = ""
    body: str = ""
    date: str = ""
    verified_purchase: bool = True


class SalesRecord(BaseModel):
    date: str = ""
    sku: str = ""
    product_name: str = ""
    units: int = 0
    sessions: int = 0
    conversions: int = 0
    conversion_rate: float = 0.0
    cr_7d_avg: float = 0.0
    cr_change_pct: float = 0.0
    buy_box_price: float = 0.0


# ---- 问题 / Issue ----

class Issue(BaseModel):
    """规则引擎检测到的一个问题"""
    type: IssueType
    severity: Severity
    sku: str = ""
    target: str = ""  # 关联对象（SKU、Campaign、Keyword 等）
    description: str = ""
    recommended_action: str = ""
    raw_data: dict[str, Any] = Field(default_factory=dict)


# ---- AI 总结 ----

class ReportSummary(BaseModel):
    """AI 生成的结构化晨报"""
    title: str = ""
    overview: str = ""
    ai_powered: bool = False  # 是否由 AI 生成（False = 模板降级）
    raw_text: str = ""  # 原始 AI 返回文本（兜底用）


# ---- 完整报告 ----

class ReportData(BaseModel):
    """一份完整的运营晨报"""
    id: str = ""
    date: str = ""
    created_at: str = ""
    issues: list[Issue] = Field(default_factory=list)
    summary: ReportSummary = Field(default_factory=ReportSummary)
    issue_count: int = 0
    high_count: int = 0
    medium_count: int = 0
    low_count: int = 0

    def compute_counts(self):
        self.issue_count = len(self.issues)
        self.high_count = sum(1 for i in self.issues if i.severity == Severity.HIGH)
        self.medium_count = sum(1 for i in self.issues if i.severity == Severity.MEDIUM)
        self.low_count = sum(1 for i in self.issues if i.severity == Severity.LOW)


# ---- API 请求 / 响应 ----

class GenerateReportRequest(BaseModel):
    data_dir: Optional[str] = None  # None = 使用 uploads 目录
    use_mock: bool = False  # True = 使用 mock 数据
    send_email: bool = False


class SettingsResponse(BaseModel):
    """脱敏后的配置响应"""
    has_minimax: bool = False
    minimax_model: str = "MiniMax-M3"
    has_smtp: bool = False
    smtp_host: str = ""
    smtp_port: int = 587
    email_from: str = ""
    email_to: str = ""
    inventory_low_stock_days: int = 15
    ad_waste_min_spend: float = 10.0
    keyword_low_conv_min_clicks: int = 20
    conversion_drop_threshold: float = -20.0
    negative_review_max_rating: int = 2


class SettingsUpdate(BaseModel):
    """配置更新请求"""
    minimax_api_key: Optional[str] = None
    minimax_model: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    email_from: Optional[str] = None
    email_to: Optional[str] = None
    inventory_low_stock_days: Optional[int] = None
    ad_waste_min_spend: Optional[float] = None
    keyword_low_conv_min_clicks: Optional[int] = None
    conversion_drop_threshold: Optional[float] = None
    negative_review_max_rating: Optional[int] = None


# ---- 经营概览 ----

class MetricWithComparison(BaseModel):
    """带对比百分比的指标"""
    label: str = ""
    current: float = 0.0
    previous: float = 0.0
    change_pct: float = 0.0  # 正数=上升, 负数=下降
    unit: str = ""  # "元", "人", "%", "单"
    trend: str = "up"  # "up" / "down" / "flat"


class TrendDataPoint(BaseModel):
    """趋势图单个数据点"""
    date: str = ""
    payment: float = 0.0
    visitors: int = 0
    orders: int = 0
    exposure: int = 0


class ChannelDetail(BaseModel):
    """渠道详情 (直播自营 / 短视频自营)"""
    name: str = ""
    exposure: MetricWithComparison = Field(default_factory=MetricWithComparison)
    clicks: MetricWithComparison = Field(default_factory=MetricWithComparison)
    payment: MetricWithComparison = Field(default_factory=MetricWithComparison)
    orders: MetricWithComparison = Field(default_factory=MetricWithComparison)
    visitors: MetricWithComparison = Field(default_factory=MetricWithComparison)
    click_payment_rate: MetricWithComparison = Field(default_factory=MetricWithComparison)


class TopSKU(BaseModel):
    """Top 商品行"""
    rank: int = 0
    sku: str = ""
    product_name: str = ""
    units: int = 0
    revenue: float = 0.0
    conversion_rate: float = 0.0
    stock_status: str = "normal"  # normal / low / out
    days_of_supply: float = 0.0


class AdPerformanceRow(BaseModel):
    """广告投放表现行"""
    campaign_name: str = ""
    keyword: str = ""
    impressions: int = 0
    clicks: int = 0
    spend: float = 0.0
    sales: float = 0.0
    orders: int = 0
    acos: float = 0.0        # 广告成本销售比 %
    roas: float = 0.0        # 广告投资回报率
    status: str = "normal"   # profitable / waste / low_conversion / normal


class AnomalyAlert(BaseModel):
    """异常提示条"""
    level: str = "info"       # critical / warning / info
    title: str = ""
    description: str = ""
    source: str = ""           # conversion / inventory / ad / review / refund


class ChannelBreakdownItem(BaseModel):
    """渠道拆分柱状图单条"""
    name: str = ""
    visitors: int = 0
    payment: float = 0.0
    orders: int = 0


class BusinessOverview(BaseModel):
    """经营概览数据"""
    date_range: str = "7d"  # realtime, 1d, 7d, 30d
    date_range_label: str = "近7天"
    # 核心指标 (第一屏 KPI 卡)
    total_payment: MetricWithComparison = Field(default_factory=MetricWithComparison)       # 用户支付总金额 (GMV)
    exposure_count: MetricWithComparison = Field(default_factory=MetricWithComparison)       # 商品曝光人数
    click_payment_rate: MetricWithComparison = Field(default_factory=MetricWithComparison)   # 商品点击支付率 (转化率)
    refund_amount: MetricWithComparison = Field(default_factory=MetricWithComparison)        # 退款金额
    order_count: MetricWithComparison = Field(default_factory=MetricWithComparison)          # 订单成交数
    visitor_count: MetricWithComparison = Field(default_factory=MetricWithComparison)        # 访客人数
    favorite_cart_count: MetricWithComparison = Field(default_factory=MetricWithComparison)  # 收藏加购
    # 扩展指标
    aov: MetricWithComparison = Field(default_factory=MetricWithComparison)                  # 客单价
    refund_rate: MetricWithComparison = Field(default_factory=MetricWithComparison)          # 退款率
    roas: MetricWithComparison = Field(default_factory=MetricWithComparison)                 # 广告投资回报率
    cac: MetricWithComparison = Field(default_factory=MetricWithComparison)                  # 获客成本
    stockout_rate: MetricWithComparison = Field(default_factory=MetricWithComparison)        # 缺货率
    # 趋势数据
    trend: list[TrendDataPoint] = Field(default_factory=list)
    # 渠道详情
    live_streaming: ChannelDetail = Field(default_factory=ChannelDetail)   # 直播自营详情
    short_video: ChannelDetail = Field(default_factory=ChannelDetail)      # 短视频自营详情
    # 新增: 表格 / 明细
    top_skus: list[TopSKU] = Field(default_factory=list)                    # Top 商品表
    ad_performance: list[AdPerformanceRow] = Field(default_factory=list)    # 广告投放表现表
    anomaly_alerts: list[AnomalyAlert] = Field(default_factory=list)        # 异常提示条
    channel_breakdown: list[ChannelBreakdownItem] = Field(default_factory=list)  # 渠道拆分柱状图


# ---- 小红书 (XHS) 数据 ----

class XHSNoteRecord(BaseModel):
    """小红书作品记录 — 对应 XHS-Downloader ExploreData.db"""
    note_id: str = ""
    note_type: str = ""           # 视频 / 图文 / 图集
    title: str = ""
    desc: str = ""
    tags: str = ""
    publish_time: str = ""
    collect_time: str = ""
    liked_count: int = 0
    comment_count: int = 0
    share_count: int = 0
    collect_count: int = 0        # 收藏数
    author_nickname: str = ""
    author_id: str = ""
    note_url: str = ""

    @property
    def engagement(self) -> int:
        """总互动量 = 点赞 + 评论 + 分享 + 收藏"""
        return self.liked_count + self.comment_count + self.share_count + self.collect_count


class XHSStats(BaseModel):
    """小红书数据汇总统计"""
    total_notes: int = 0
    total_likes: int = 0
    total_comments: int = 0
    total_shares: int = 0
    total_collects: int = 0
    total_engagement: int = 0
    avg_engagement: float = 0.0
    video_count: int = 0
    image_count: int = 0
    gallery_count: int = 0
    top_authors: list[dict] = Field(default_factory=list)   # [{name, notes, engagement}]
    trending_notes: list[XHSNoteRecord] = Field(default_factory=list)  # 爆款内容
    low_engagement_notes: list[XHSNoteRecord] = Field(default_factory=list)  # 低互动预警
