"use client";

import { Sparkles, RefreshCw, Download, ChevronRight } from "lucide-react";

const DATE_RANGES = [
  { value: "realtime", label: "实时" },
  { value: "1d", label: "近1天" },
  { value: "7d", label: "近7天" },
  { value: "30d", label: "近30天" },
];

const CHANNELS = [
  "全部渠道",
  "自然搜索",
  "广告投放",
  "直播自营",
  "短视频自营",
  "站外引流",
];

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
    <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
      {/* Left: Breadcrumb + Title */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-faint font-medium">Dashboard</span>
        <ChevronRight className="w-3 h-3 text-fainter" />
        <span className="text-xs text-fg font-medium">运营总览</span>
        {dateLabel && (
          <span className="ml-2 text-[10px] text-muted bg-panel border border-line px-2 py-0.5 rounded-full font-mono">
            {dateLabel}
          </span>
        )}
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        {/* Date Range — segmented control */}
        <div className="flex bg-panel border border-line rounded-md p-0.5 font-mono">
          {DATE_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => onDateRangeChange(range.value)}
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

        {/* Channel Filter */}
        <select
          value={channel}
          onChange={(e) => onChannelChange(e.target.value)}
          className="text-[11px] border border-line rounded-md px-2.5 py-1.5 bg-panel text-fg focus:outline-none focus:border-[#33363d] cursor-pointer"
        >
          {CHANNELS.map((ch) => (
            <option key={ch} value={ch}>
              {ch}
            </option>
          ))}
        </select>

        {/* Export */}
        <button
          className="flex items-center gap-1 text-faint hover:text-fg border border-line bg-panel px-2.5 py-1.5 rounded-md text-[11px] font-medium hover:bg-panel-2"
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
          className="text-faint hover:text-fg p-1.5 rounded-md hover:bg-panel-2 border border-line bg-panel"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>

        {/* Generate Report */}
        <button
          onClick={onGenerate}
          disabled={generating}
          className="flex items-center gap-1.5 bg-ink text-app px-3 py-1.5 rounded-md text-[11px] font-semibold hover:bg-white disabled:opacity-50"
        >
          {generating ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3" />
          )}
          {generating ? "生成中" : "生成晨报"}
        </button>
      </div>
    </div>
  );
}
