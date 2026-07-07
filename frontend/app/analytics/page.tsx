"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp as TrendingUpIcon,
  Filter,
  Eye,
  Users,
  ShoppingCart,
  DollarSign,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { getBusinessOverview, getLatestReport } from "@/lib/api";
import type { BusinessOverview as BusinessOverviewData, ReportData } from "@/lib/types";
import TrendChart from "@/components/TrendChart";
import ChannelBarChart from "@/components/ChannelBarChart";
import ChannelDetailCard from "@/components/ChannelDetailCard";
import TopSKUTable from "@/components/TopSKUTable";
import AdPerformanceTable from "@/components/AdPerformanceTable";

const DATE_RANGES = [
  { value: "realtime", label: "实时" },
  { value: "1d", label: "近1天" },
  { value: "7d", label: "近7天" },
  { value: "30d", label: "近30天" },
];

function formatNum(value: number, unit: string): string {
  if (unit === "元") {
    if (value >= 10000) return `${(value / 10000).toFixed(2)}万`;
    return value.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  }
  if (unit === "%") return value.toFixed(2) + "%";
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  return value.toLocaleString("zh-CN");
}

// 漏斗各阶段的灰阶（由深到浅）
const FUNNEL_SHADES = ["bg-ink", "bg-[#c8cbd1]", "bg-[#9a9da4]", "bg-[#74777f]"];

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<BusinessOverviewData | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7d");

  const loadData = useCallback(async (range: string) => {
    setLoading(true);
    try {
      const data = await getBusinessOverview(range);
      setOverview(data);
    } catch (err) {
      console.error("获取数据失败:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData(dateRange);
    getLatestReport().then(setReport).catch(() => {});
  }, [dateRange, loadData]);

  // 转化漏斗数据
  const funnelData = overview
    ? [
        { label: "曝光人数", value: overview.exposure_count.current, icon: Eye },
        { label: "访客人数", value: overview.visitor_count.current, icon: Users },
        { label: "成交订单", value: overview.order_count.current, icon: ShoppingCart },
        { label: "支付金额", value: overview.total_payment.current, icon: DollarSign, isMoney: true },
      ]
    : [];

  const funnelMax = Math.max(...funnelData.map((d) => d.value), 1);

  // 问题分布统计
  const issueStats = report
    ? report.issues.reduce((acc, issue) => {
        acc[issue.type] = (acc[issue.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    : {};

  const ISSUE_LABELS: Record<string, string> = {
    inventory_low_stock: "库存预警",
    ad_waste: "广告无效花费",
    keyword_low_conversion: "关键词低转化",
    negative_review: "差评归因",
    conversion_drop: "转化率骤降",
  };

  return (
    <div className="px-6 py-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-faint font-medium">Analytics</span>
          <ChevronRight className="w-3 h-3 text-fainter" />
          <span className="text-xs text-fg font-medium">数据分析</span>
          {overview && (
            <span className="ml-2 text-[10px] text-muted bg-panel border border-line px-2 py-0.5 rounded-full font-mono">
              {overview.date_range_label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-panel border border-line rounded-md p-0.5 font-mono">
            {DATE_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => setDateRange(range.value)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-[5px] ${
                  dateRange === range.value
                    ? "bg-panel-2 text-ink"
                    : "text-faint hover:text-fg"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => loadData(dateRange)}
            className="text-faint hover:text-fg p-1.5 rounded-md hover:bg-panel-2 border border-line bg-panel"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-fainter">
          <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-fainter" />
          <span className="text-xs">加载分析数据...</span>
        </div>
      ) : !overview ? (
        <div className="bg-panel rounded-md border border-line p-8 text-center text-fainter">
          暂无数据
        </div>
      ) : (
        <div className="space-y-4">
          {/* ===== 转化漏斗 ===== */}
          <div className="bg-panel rounded-md border border-line p-5">
            <div className="flex items-center gap-1.5 mb-4">
              <Filter className="w-3.5 h-3.5 text-muted" />
              <span className="text-[10px] font-semibold text-muted uppercase tracking-[0.16em] font-mono">
                转化漏斗分析
              </span>
              <span className="text-[10px] text-fainter font-mono">曝光 → 访客 → 订单 → 支付</span>
            </div>
            <div className="space-y-2">
              {funnelData.map((stage, idx) => {
                const widthPct = (stage.value / funnelMax) * 100;
                const prevValue = idx > 0 ? funnelData[idx - 1].value : 0;
                const convRate = prevValue > 0 ? ((stage.value / prevValue) * 100).toFixed(1) : null;
                const Icon = stage.icon;
                const isDark = idx < 2;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-24 flex items-center gap-1.5 flex-shrink-0">
                      <Icon className="w-3 h-3 text-fainter" />
                      <span className="text-[11px] text-faint font-medium">{stage.label}</span>
                    </div>
                    <div className="flex-1 relative">
                      <div
                        className={`h-8 rounded-[4px] ${FUNNEL_SHADES[idx]} flex items-center justify-end px-2.5`}
                        style={{ width: `${Math.max(widthPct, 8)}%` }}
                      >
                        <span
                          className={`text-[11px] font-bold font-mono ${
                            isDark ? "text-app" : "text-app"
                          }`}
                        >
                          {stage.isMoney
                            ? "¥" + formatNum(stage.value, "元")
                            : formatNum(stage.value, "")}
                        </span>
                      </div>
                    </div>
                    {convRate && (
                      <div className="w-16 text-right flex-shrink-0">
                        <span className="text-[10px] text-fainter font-mono">转化率</span>
                        <div className="text-[11px] font-semibold text-fg font-mono">{convRate}%</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ===== 核心趋势 ===== */}
          <div className="bg-panel rounded-md border border-line p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <TrendingUpIcon className="w-3.5 h-3.5 text-muted" />
              <span className="text-[10px] font-semibold text-muted uppercase tracking-[0.16em] font-mono">
                趋势分析
              </span>
              <span className="text-[10px] text-fainter font-mono">· {overview.date_range_label}</span>
            </div>
            <TrendChart data={overview.trend} />
          </div>

          {/* ===== 渠道分析 ===== */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-[0.16em] font-mono">
                渠道分析
              </span>
              <span className="text-[10px] text-fainter font-mono">流量来源与渠道效率</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1 bg-panel rounded-md border border-line p-4">
                <ChannelBarChart data={overview.channel_breakdown} />
              </div>
              <div className="col-span-2 grid grid-cols-2 gap-3">
                <ChannelDetailCard channel={overview.live_streaming} icon="live" />
                <ChannelDetailCard channel={overview.short_video} icon="video" />
              </div>
            </div>
          </div>

          {/* ===== 商品 & 广告明细 ===== */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-[0.16em] font-mono">
                商品与广告分析
              </span>
              <span className="text-[10px] text-fainter font-mono">Top SKU &amp; 投放效率</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TopSKUTable skus={overview.top_skus} />
              <AdPerformanceTable rows={overview.ad_performance} />
            </div>
          </div>

          {/* ===== 问题分布分析 ===== */}
          {report && report.issues.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[10px] font-semibold text-muted uppercase tracking-[0.16em] font-mono">
                  问题分布分析
                </span>
                <span className="text-[10px] text-fainter font-mono">
                  {report.date} · 共 {report.issue_count} 个问题
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {/* 严重度分布 */}
                <div className="bg-panel rounded-md border border-line p-4">
                  <h4 className="text-[11px] font-semibold text-fg mb-3">严重度分布</h4>
                  <div className="space-y-2.5">
                    {[
                      { label: "高优先级", count: report.high_count, bar: "bg-down", text: "text-down" },
                      { label: "中优先级", count: report.medium_count, bar: "bg-warn", text: "text-warn" },
                      { label: "低优先级", count: report.low_count, bar: "bg-info", text: "text-info" },
                    ].map((item) => {
                      const pct = report.issue_count > 0 ? (item.count / report.issue_count) * 100 : 0;
                      return (
                        <div key={item.label}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-faint">{item.label}</span>
                            <span className={`text-[11px] font-bold font-mono ${item.text}`}>{item.count}</span>
                          </div>
                          <div className="h-1.5 bg-line-soft rounded-full overflow-hidden">
                            <div className={`h-full ${item.bar} rounded-full`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 问题类型分布 */}
                <div className="col-span-2 bg-panel rounded-md border border-line p-4">
                  <h4 className="text-[11px] font-semibold text-fg mb-3">问题类型分布</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(ISSUE_LABELS).map(([type, label]) => {
                      const count = issueStats[type] || 0;
                      const hasIssue = count > 0;
                      return (
                        <div
                          key={type}
                          className={`rounded-md p-2.5 text-center border ${
                            hasIssue ? "border-line bg-inset" : "border-line-soft bg-inset/40"
                          }`}
                        >
                          {hasIssue ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-warn mx-auto mb-1" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5 text-fainter mx-auto mb-1" />
                          )}
                          <div
                            className={`text-lg font-bold font-display ${
                              hasIssue ? "text-fg-strong" : "text-fainter"
                            }`}
                          >
                            {count}
                          </div>
                          <div className="text-[9px] text-fainter leading-tight">{label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
