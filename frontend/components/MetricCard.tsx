"use client";

import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import type { MetricWithComparison } from "@/lib/types";

interface MetricCardProps {
  metric: MetricWithComparison;
  icon?: LucideIcon;
  accentColor?: string; // e.g. "blue", "green", "amber", "red", "purple"
}

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-500" },
  green: { bg: "bg-green-50", text: "text-green-500" },
  amber: { bg: "bg-amber-50", text: "text-amber-500" },
  red: { bg: "bg-red-50", text: "text-red-500" },
  purple: { bg: "bg-purple-50", text: "text-purple-500" },
  cyan: { bg: "bg-cyan-50", text: "text-cyan-500" },
};

function formatNumber(value: number, unit: string): string {
  if (unit === "元") {
    if (value >= 10000) return `${(value / 10000).toFixed(2)}万`;
    return value.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  }
  if (unit === "%") return value.toFixed(2) + "%";
  if (unit === "") return value.toFixed(2);
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  return value.toLocaleString("zh-CN");
}

export default function MetricCard({ metric, icon: Icon, accentColor = "blue" }: MetricCardProps) {
  const isUp = metric.trend === "up";
  const isDown = metric.trend === "down";
  const isFlat = metric.trend === "flat";

  // 退款相关指标上升是坏事
  const isNegativeMetric = metric.label.includes("退款") || metric.label.includes("缺货");
  const isGood = isFlat ? null : isNegativeMetric ? !isUp : isUp;

  const colors = COLOR_MAP[accentColor] || COLOR_MAP.blue;

  return (
    <div className="bg-white rounded-lg border border-slate-200/70 p-3.5 hover:border-slate-300 hover:shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <span className="text-[11px] text-slate-500 font-medium">{metric.label}</span>
        {Icon && (
          <div className={`w-6 h-6 rounded-md ${colors.bg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-3 h-3 ${colors.text}`} />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-xl font-bold text-slate-800 tracking-tight">
          {formatNumber(metric.current, metric.unit)}
        </span>
        {metric.unit && metric.unit !== "" && (
          <span className="text-[10px] text-slate-400">{metric.unit}</span>
        )}
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-slate-400">
          上期 {formatNumber(metric.previous, metric.unit)}
        </span>
        <span
          className={`flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
            isFlat
              ? "bg-slate-100 text-slate-500"
              : isGood
              ? "bg-emerald-50 text-emerald-600"
              : "bg-red-50 text-red-500"
          }`}
        >
          {isUp && <TrendingUp className="w-2.5 h-2.5" />}
          {isDown && <TrendingDown className="w-2.5 h-2.5" />}
          {isFlat && <Minus className="w-2.5 h-2.5" />}
          {metric.change_pct > 0 ? "+" : ""}{metric.change_pct}%
        </span>
      </div>
    </div>
  );
}
