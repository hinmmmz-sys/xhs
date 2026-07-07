"use client";

import { Sparkles, RefreshCw, Download, ChevronRight } from "lucide-react";

const DATE_RANGES = [
  { value: "realtime", label: "实时" },
  { value: "1d", label: "近1天" },
  { value: "7d", label: "近7天" },
  { value: "30d", label: "近30天" },
];

const CHANNELS = ["全部渠道", "自然搜索", "广告投放", "直播自营", "短视频自营", "站外引流"];

interface DashboardToolbarProps {
  dateRange: string;
  onDateRangeChange: (value: string) => void;
  channel: string;
  onChannelChange: (value: string) => void;
  onRefresh: () => void;
  onGenerate: () => void;
  loading: boolean;
  generating: boolean;
  dateLabel?: string;
}

export default function DashboardToolbar({
  dateRange,
  onDateRangeChange,
  channel,
  onChannelChange,
  onRefresh,
  onGenerate,
  loading,
  generating,
  dateLabel,
}: DashboardToolbarProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
      {/* Left: Breadcrumb + Title */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 font-medium">Dashboard</span>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="text-xs text-slate-600 font-medium">运营总览</span>
        {dateLabel && (
          <span className="ml-2 text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {dateLabel}
          </span>
        )}
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        {/* Date Range — segmented control */}
        <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
          {DATE_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => onDateRangeChange(range.value)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md ${
                dateRange === range.value
                  ? "bg-slate-800 text-white"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Channel Filter */}
        <select
          value={channel}
          onChange={(e) => onChannelChange(e.target.value)}
          className="text-[11px] border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-50 shadow-sm cursor-pointer"
        >
          {CHANNELS.map((ch) => (
            <option key={ch} value={ch}>
              {ch}
            </option>
          ))}
        </select>

        {/* Export */}
        <button
          className="flex items-center gap-1 text-slate-500 hover:text-slate-700 border border-slate-200 bg-white px-2.5 py-1.5 rounded-lg text-[11px] font-medium hover:bg-slate-50 shadow-sm"
          onClick={() => {
            const blob = new Blob(["导出功能开发中"], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "morning-report.txt";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <Download className="w-3 h-3" />
          导出
        </button>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 border border-slate-200 bg-white shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>

        {/* Generate Report */}
        <button
          onClick={onGenerate}
          disabled={generating}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[11px] font-medium hover:bg-blue-700 disabled:opacity-50 shadow-sm"
        >
          {generating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          {generating ? "生成中" : "生成晨报"}
        </button>
      </div>
    </div>
  );
}
