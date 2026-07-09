"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  ShoppingCart,
  Percent,
  TrendingUp as TrendingUpIcon,
  RotateCcw,
  Users,
  Eye,
  Target,
  UserPlus,
  PackageX,
  Sparkles,
  RefreshCw,
  FileText,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
} from "lucide-react";
import { getLatestReport, generateReport, getBusinessOverview } from "@/lib/api";
import type { ReportData, BusinessOverview as BusinessOverviewData } from "@/lib/types";
import DashboardToolbar from "@/components/DashboardToolbar";
import MetricCard from "@/components/MetricCard";
import AnomalyAlertBar from "@/components/AnomalyAlertBar";
import TrendChart from "@/components/TrendChart";
import ChannelBarChart from "@/components/ChannelBarChart";
import ChannelDetailCard from "@/components/ChannelDetailCard";
import TopSKUTable from "@/components/TopSKUTable";
import AdPerformanceTable from "@/components/AdPerformanceTable";
import IssueList from "@/components/IssueList";

export default function DashboardPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [overview, setOverview] = useState<BusinessOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState("7d");
  const [channel, setChannel] = useState("全部渠道");

  const loadOverview = useCallback(async (range: string) => {
    setLoading(true);
    try {
      const data = await getBusinessOverview(range);
      setOverview(data);
    } catch (err) {
      console.error("获取经营概览失败:", err);
    }
    setLoading(false);
  }, []);

  const loadLatest = useCallback(async () => {
    const data = await getLatestReport();
    setReport(data);
  }, []);

  useEffect(() => {
    loadOverview(dateRange);
    loadLatest();
  }, [dateRange, loadOverview, loadLatest]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      const data = await generateReport({ useMock: true, sendEmail: false });
      setReport(data);
    } catch (err) {
      setError("生成报告失败，请确保后端服务已启动");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-5">
      {/* ===== Header / Toolbar ===== */}
      <DashboardToolbar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        channel={channel}
        onChannelChange={setChannel}
        onRefresh={() => loadOverview(dateRange)}
        onGenerate={handleGenerate}
        loading={loading}
        generating={generating}
        dateLabel={overview?.date_range_label}
      />

      {error && (
        <div className="bg-down/10 border border-down/30 text-down rounded-md p-3 mb-5 text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-fainter">
          <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-fainter" />
          <span className="text-xs">加载仪表盘数据...</span>
        </div>
      ) : !overview ? (
        <div className="bg-panel rounded-md border border-line p-8 text-center text-fainter">
          暂无数据
        </div>
      ) : (
        <div className="space-y-4">
          {/* ===== 异常提示 ===== */}
          <AnomalyAlertBar alerts={overview.anomaly_alerts} />

          {/* KPI Cards — Row 1: 今日总览 */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-[0.16em] font-mono">
                今日总览
              </span>
              <span className="text-[10px] text-fainter font-mono">· CORE METRICS</span>
            </div>
            <div className="grid grid-cols-5 gap-3">
              <MetricCard metric={overview.total_payment} icon={DollarSign} />
              <MetricCard metric={overview.order_count} icon={ShoppingCart} />
              <MetricCard metric={overview.click_payment_rate} icon={Percent} />
              <MetricCard metric={overview.aov} icon={TrendingUpIcon} />
              <MetricCard metric={overview.refund_rate} icon={RotateCcw} />
            </div>
          </div>

          {/* KPI Cards — Row 2: 流量与投放 */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-[0.16em] font-mono">
                流量与投放
              </span>
              <span className="text-[10px] text-fainter font-mono">· TRAFFIC &amp; ADS</span>
            </div>
            <div className="grid grid-cols-5 gap-3">
              <MetricCard metric={overview.visitor_count} icon={Users} />
              <MetricCard metric={overview.exposure_count} icon={Eye} />
              <MetricCard metric={overview.roas} icon={Target} />
              <MetricCard metric={overview.cac} icon={UserPlus} />
              <MetricCard metric={overview.stockout_rate} icon={PackageX} />
            </div>
          </div>

          {/* ===== 核心趋势 + 渠道拆分 ===== */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 bg-panel rounded-md border border-line p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <TrendingUpIcon className="w-3.5 h-3.5 text-muted" />
                <span className="text-[10px] font-semibold text-muted uppercase tracking-[0.16em] font-mono">
                  核心趋势分析
                </span>
                <span className="text-[10px] text-fainter font-mono">· {overview.date_range_label}</span>
              </div>
              <TrendChart data={overview.trend} />
            </div>
            <div className="bg-panel rounded-md border border-line p-4">
              <ChannelBarChart data={overview.channel_breakdown} />
            </div>
          </div>

          {/* 渠道自营详情 */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-[0.16em] font-mono">
                渠道自营详情
              </span>
              <span className="text-[10px] text-fainter font-mono">· 直播 &amp; 短视频</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ChannelDetailCard channel={overview.live_streaming} icon="live" />
              <ChannelDetailCard channel={overview.short_video} icon="video" />
            </div>
          </div>

          {/* ===== 商品 & 广告明细表 ===== */}
          <div className="grid grid-cols-2 gap-3">
            <TopSKUTable skus={overview.top_skus} />
            <AdPerformanceTable rows={overview.ad_performance} />
          </div>

          {/* ===== 今日结论与动作 ===== */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-[0.16em] font-mono">
                今日结论与动作
              </span>
              <span className="text-[10px] text-fainter font-mono">
                {report ? `· ${report.date}` : "· 暂无晨报"}
              </span>
            </div>

            {!report ? (
              <div className="bg-panel rounded-md border border-line p-6 text-center">
                <FileText className="w-8 h-8 text-fainter mx-auto mb-2" />
                <h3 className="text-xs font-semibold text-fg mb-1">暂无运营晨报</h3>
                <p className="text-[10px] text-fainter mb-3">
                  点击右上角&ldquo;生成晨报&rdquo;按钮使用模拟数据快速生成
                </p>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="inline-flex items-center gap-1.5 bg-ink text-app px-3 py-1.5 rounded-md text-[11px] font-semibold hover:bg-white disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3" />
                  生成晨报
                </button>
              </div>
            ) : (
              <>
                {/* Stats summary */}
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div className="bg-panel rounded-md border border-line p-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-faint font-mono">问题总数</span>
                      <AlertTriangle className="w-3.5 h-3.5 text-fainter" />
                    </div>
                    <div className="text-xl font-bold text-ink tabular font-display">{report.issue_count}</div>
                  </div>
                  <div className="bg-panel rounded-md border border-line border-l-2 border-l-down p-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-down font-mono">高优先级</span>
                      <AlertTriangle className="w-3.5 h-3.5 text-down" />
                    </div>
                    <div className="text-xl font-bold text-down tabular font-display">{report.high_count}</div>
                  </div>
                  <div className="bg-panel rounded-md border border-line border-l-2 border-l-warn p-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-warn font-mono">中优先级</span>
                      <AlertTriangle className="w-3.5 h-3.5 text-warn" />
                    </div>
                    <div className="text-xl font-bold text-warn tabular font-display">{report.medium_count}</div>
                  </div>
                  <div className="bg-panel rounded-md border border-line border-l-2 border-l-info p-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-info font-mono">低优先级</span>
                      <CheckCircle className="w-3.5 h-3.5 text-info" />
                    </div>
                    <div className="text-xl font-bold text-info tabular font-display">{report.low_count}</div>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="bg-panel rounded-md border border-line p-4 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-3.5 h-3.5 text-warn" />
                    <h3 className="text-xs font-semibold text-fg-strong">{report.summary.title}</h3>
                    {report.summary.ai_powered ? (
                      <span className="text-[10px] text-ai border border-ai/30 px-1.5 py-0.5 rounded-[3px] flex items-center gap-0.5 font-mono">
                        <Sparkles className="w-2.5 h-2.5" /> AI
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted border border-line px-1.5 py-0.5 rounded-[3px] font-mono">
                        模板
                      </span>
                    )}
                  </div>
                  <div className="bg-inset border border-line-soft rounded-[5px] p-3.5 text-xs text-fg whitespace-pre-wrap leading-relaxed">
                    {report.summary.overview}
                  </div>
                </div>

                {/* Issues / Actions */}
                <div className="bg-panel rounded-md border border-line p-4">
                  <h3 className="text-xs font-semibold text-fg-strong mb-3">
                    待办事项 ({report.issue_count})
                  </h3>
                  <IssueList issues={report.issues} />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
