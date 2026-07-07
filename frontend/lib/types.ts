// 后端 API 类型定义 — 与 backend/app/schemas.py 对应

export type IssueType =
  | "inventory_low_stock"
  | "ad_waste"
  | "keyword_low_conversion"
  | "negative_review"
  | "conversion_drop";

export type Severity = "high" | "medium" | "low";

export interface Issue {
  type: IssueType;
  severity: Severity;
  sku: string;
  target: string;
  description: string;
  recommended_action: string;
  raw_data: Record<string, unknown>;
}

export interface ReportSummary {
  title: string;
  overview: string;
  ai_powered: boolean;
  raw_text: string;
}

export interface ReportData {
  id: string;
  date: string;
  created_at: string;
  issues: Issue[];
  summary: ReportSummary;
  issue_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
}

export interface ReportListItem {
  id: string;
  date: string;
  created_at: string;
  issue_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  title: string;
  ai_powered: boolean;
}

export interface SettingsResponse {
  has_minimax: boolean;
  minimax_model: string;
  has_smtp: boolean;
  smtp_host: string;
  smtp_port: number;
  email_from: string;
  email_to: string;
  inventory_low_stock_days: number;
  ad_waste_min_spend: number;
  keyword_low_conv_min_clicks: number;
  conversion_drop_threshold: number;
  negative_review_max_rating: number;
}

export interface SettingsUpdate {
  minimax_api_key?: string;
  minimax_model?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
  email_from?: string;
  email_to?: string;
  inventory_low_stock_days?: number;
  ad_waste_min_spend?: number;
  keyword_low_conv_min_clicks?: number;
  conversion_drop_threshold?: number;
  negative_review_max_rating?: number;
}

export interface UploadedFile {
  filename: string;
  file_type: string;
  source: string;
  size: number;
}

// 问题类型中文标签
export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  inventory_low_stock: "库存预警",
  ad_waste: "广告无效花费",
  keyword_low_conversion: "关键词低转化",
  negative_review: "差评归因",
  conversion_drop: "转化率骤降",
};

// 严重度配置
export const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string; border: string }> = {
  high: { label: "高优先级", color: "text-red-700", bg: "bg-red-50", border: "border-red-500" },
  medium: { label: "中优先级", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-500" },
  low: { label: "低优先级", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-500" },
};

// ---- 经营概览 ----

export interface MetricWithComparison {
  label: string;
  current: number;
  previous: number;
  change_pct: number; // 正数=上升, 负数=下降
  unit: string;
  trend: "up" | "down" | "flat";
}

export interface TrendDataPoint {
  date: string;
  payment: number;
  visitors: number;
  orders: number;
  exposure: number;
}

export interface ChannelDetail {
  name: string;
  exposure: MetricWithComparison;
  clicks: MetricWithComparison;
  payment: MetricWithComparison;
  orders: MetricWithComparison;
  visitors: MetricWithComparison;
  click_payment_rate: MetricWithComparison;
}

export interface TopSKU {
  rank: number;
  sku: string;
  product_name: string;
  units: number;
  revenue: number;
  conversion_rate: number;
  stock_status: "normal" | "low" | "out";
  days_of_supply: number;
}

export interface AdPerformanceRow {
  campaign_name: string;
  keyword: string;
  impressions: number;
  clicks: number;
  spend: number;
  sales: number;
  orders: number;
  acos: number;
  roas: number;
  status: "profitable" | "waste" | "low_conversion" | "normal";
}

export interface AnomalyAlert {
  level: "critical" | "warning" | "info";
  title: string;
  description: string;
  source: string;
}

export interface ChannelBreakdownItem {
  name: string;
  visitors: number;
  payment: number;
  orders: number;
}

export interface BusinessOverview {
  date_range: string;
  date_range_label: string;
  // 核心指标
  total_payment: MetricWithComparison;
  exposure_count: MetricWithComparison;
  click_payment_rate: MetricWithComparison;
  refund_amount: MetricWithComparison;
  order_count: MetricWithComparison;
  visitor_count: MetricWithComparison;
  favorite_cart_count: MetricWithComparison;
  // 扩展指标
  aov: MetricWithComparison;
  refund_rate: MetricWithComparison;
  roas: MetricWithComparison;
  cac: MetricWithComparison;
  stockout_rate: MetricWithComparison;
  // 趋势数据
  trend: TrendDataPoint[];
  // 渠道详情
  live_streaming: ChannelDetail;
  short_video: ChannelDetail;
  // 表格 / 明细
  top_skus: TopSKU[];
  ad_performance: AdPerformanceRow[];
  anomaly_alerts: AnomalyAlert[];
  channel_breakdown: ChannelBreakdownItem[];
}

export interface DateRangeOption {
  value: string;
  label: string;
}

// ---- 小红书 (XHS) 数据 ----

export interface XHSNoteRecord {
  note_id: string;
  note_type: string;        // 视频 / 图文 / 图集
  title: string;
  desc: string;
  tags: string;
  publish_time: string;
  collect_time: string;
  liked_count: number;
  comment_count: number;
  share_count: number;
  collect_count: number;
  author_nickname: string;
  author_id: string;
  note_url: string;
}

export interface XHSAuthorStats {
  name: string;
  notes: number;
  engagement: number;
}

export interface XHSStats {
  total_notes: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_collects: number;
  total_engagement: number;
  avg_engagement: number;
  video_count: number;
  image_count: number;
  gallery_count: number;
  top_authors: XHSAuthorStats[];
  trending_notes: XHSNoteRecord[];
  low_engagement_notes: XHSNoteRecord[];
}
