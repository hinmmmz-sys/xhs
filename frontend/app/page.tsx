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
import { getLatestReport, generateReport, getBusinessOverview, getXHSStats } from "@/lib/api";
import type { ReportData, BusinessOverview as BusinessOverviewData, XHSStats } from "@/lib/types";
import DashboardToolbar from "@/components/DashboardToolbar";
import MetricCard from "@/components/MetricCard";
import AnomalyAlertBar from "@/components/AnomalyAlertBar";
import TrendChart from "@/components/TrendChart";
import ChannelBarChart from "@/components/ChannelBarChart";
import ChannelDetailCard from "@/components/ChannelDetailCard";
import TopSKUTable from "@/components/TopSKUTable";
import AdPerformanceTable from "@/components/AdPerformanceTable";
import XHSOverviewCard from "@/components/XHSOverviewCard";
import XHSTopNotesTable from "@/components/XHSTopNotesTable";
import IssueList from "@/components/IssueList";

export default function DashboardPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [overview, setOverview] = useState<BusinessOverviewData | null>(null);
  const [xhsStats, setXhsStats] = useState<XHSStats | null>(null);
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

  const loadXHS = useCallback(async () => {
    try {
      const data = await getXHSStats();
      setXhsStats(data);
    } catch (err) {
      console.error("获取小红书数据失败:", err);
    }
  }, []);

  useEffect(() => {
    loadOverview(dateRange);
    loadLatest();
    loadXHS();
  }, [dateRange, loadOverview, loadLatest, loadXHS]);

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
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-5 text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-400">
          <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-slate-300" />
          <span className="text-xs">加载仪表盘数据...</span>
        </div>
      ) : !overview ? (
        <div className="bg-white rounded-lg border border-slate-200/70 p-8 text-center text-slate-400">
          暂无数据
        </div>
      ) : (
        <div className="space-y-4">
          {/* ===== 第一屏: KPI 总览 + 异常提示 ===== */}

          {/* Anomaly Alert Bar */}
          <AnomalyAlertBar alerts={overview.anomaly_alerts} />

          {/* KPI Cards — Row 1: 今日总览 */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">今日总览</span>
              <span className="text-[10px] text-slate-400">· 经营核心指标</span>
            </div>
            <div className="grid grid-cols-5 gap-3">
              <MetricCard metric={overview.total_payment} icon={DollarSign} accentColor="blue" />
              <MetricCard metric={overview.order_count} icon={ShoppingCart} accentColor="green" />
              <MetricCard metric={overview.click_payment_rate} icon={Percent} accentColor="cyan" />
              <MetricCard metric={overview.aov} icon={TrendingUpIcon} accentColor="purple" />
              <MetricCard metric={overview.refund_rate} icon={RotateCcw} accentColor="red" />
            </div>
          </div>

          {/* KPI Cards — Row 2: 流量与投放 */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">流量与投放</span>
              <span className="text-[10px] text-slate-400">· 渠道获客效率</span>
            </div>
            <div className="grid grid-cols-5 gap-3">
              <MetricCard metric={overview.visitor_count} icon={Users} accentColor="blue" />
              <MetricCard metric={overview.exposure_count} icon={Eye} accentColor="cyan" />
              <MetricCard metric={overview.roas} icon={Target} accentColor="green" />
              <MetricCard metric={overview.cac} icon={UserPlus} accentColor="amber" />
              <MetricCard metric={overview.stockout_rate} icon={PackageX} accentColor="red" />
            </div>
          </div>

          {/* ===== 第二屏: 核心趋势 + 渠道拆分 ===== */}

          {/* Two-column: Trend (left 2/3) + Channel Bar (right 1/3) */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 bg-white rounded-lg border border-slate-200/70 p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <TrendingUpIcon className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">核心趋势分析</span>
                <span className="text-[10px] text-slate-400">· {overview.date_range_label}</span>
              </div>
              <TrendChart data={overview.trend} />
            </div>
            <div className="bg-white rounded-lg border border-slate-200/70 p-4">
              <ChannelBarChart data={overview.channel_breakdown} />
            </div>
          </div>

          {/* 渠道自营详情 */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">渠道自营详情</span>
              <span className="text-[10px] text-slate-400">· 直播 & 短视频</span>
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

          {/* ===== 小红书种草数据 ===== */}
          {xhsStats && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">小红书种草数据</span>
                <span className="text-[10px] text-slate-400">· 来自 XHS-Downloader</span>
              </div>
              <div className="space-y-3">
                <XHSOverviewCard stats={xhsStats} />
                <XHSTopNotesTable notes={xhsStats.trending_notes} />
              </div>
            </div>
          )}

          {/* ===== 第三屏: 今日结论与动作 ===== */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">今日结论与动作</span>
              <span className="text-[10px] text-slate-400">
                {report ? `· ${report.date}` : "· 暂无晨报"}
              </span>
            </div>

            {!report ? (
              <div className="bg-white rounded-lg border border-slate-200/70 p-6 text-center">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h3 className="text-xs font-semibold text-slate-600 mb-1">暂无运营晨报</h3>
                <p className="text-[10px] text-slate-400 mb-3">
                  点击右上角"生成晨报"按钮使用模拟数据快速生成
                </p>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[11px] font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3" />
                  生成晨报
                </button>
              </div>
            ) : (
              <>
                {/* Stats summary */}
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div className="bg-white rounded-lg border border-slate-200/70 p-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-slate-500">问题总数</span>
                      <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="text-xl font-bold text-slate-800">{report.issue_count}</div>
                  </div>
                  <div className="bg-red-50/50 rounded-lg border border-red-100 p-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-red-600">高优先级</span>
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <div className="text-xl font-bold text-red-700">{report.high_count}</div>
                  </div>
                  <div className="bg-amber-50/50 rounded-lg border border-amber-100 p-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-amber-600">中优先级</span>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="text-xl font-bold text-amber-700">{report.medium_count}</div>
                  </div>
                  <div className="bg-blue-50/50 rounded-lg border border-blue-100 p-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-blue-600">低优先级</span>
                      <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div className="text-xl font-bold text-blue-700">{report.low_count}</div>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="bg-white rounded-lg border border-slate-200/70 p-4 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <h3 className="text-xs font-semibold text-slate-700">{report.summary.title}</h3>
                    {report.summary.ai_powered ? (
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> AI
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        模板
                      </span>
                    )}
                  </div>
                  <div className="bg-blue-50/40 rounded-lg p-3.5 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {report.summary.overview}
                  </div>
                </div>

                {/* Issues / Actions */}
                <div className="bg-white rounded-lg border border-slate-200/70 p-4">
                  <h3 className="text-xs font-semibold text-slate-700 mb-3">
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
