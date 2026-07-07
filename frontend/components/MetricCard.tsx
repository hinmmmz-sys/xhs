"use client";

import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import type { MetricWithComparison } from "@/lib/types";

interface MetricCardProps {
  metric: MetricWithComparison;
  icon?: LucideIcon;
  accentColor?: string; // 保留 API 兼容（深色主题下统一中性处理）
}

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

export default function MetricCard({ metric, icon: Icon }: MetricCardProps) {
  const isUp = metric.trend === "up";
  const isDown = metric.trend === "down";
  const isFlat = metric.trend === "flat";

  // 退款/缺货类指标上升是坏事
  const isNegativeMetric =
    metric.label.includes("退款") || metric.label.includes("缺货");
  const isGood = isFlat ? null : isNegativeMetric ? !isUp : isUp;

  const dotColor = isFlat ? "bg-fainter" : isGood ? "bg-up" : "bg-down";
  const deltaColor = isFlat ? "text-fainter" : isGood ? "text-up" : "text-down";

  return (
    <div className="bg-panel rounded-md border border-line p-3.5 hover:border-[#2f333b]">
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] text-faint font-mono tracking-[0.04em]">
          {metric.label}
        </span>
        {Icon ? (
          <Icon className="w-3.5 h-3.5 text-fainter flex-shrink-0" />
        ) : (
          <span className={`w-1.5 h-1.5 rounded-full ${dotColor} mt-1`} />
        )}
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-2xl font-bold text-ink tracking-tight tabular font-display">
          {formatNumber(metric.current, metric.unit)}
        </span>
        {metric.unit && metric.unit !== "" && (
          <span className="text-[10px] text-fainter">{metric.unit}</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 mt-2 font-mono">
        <span className={`flex items-center gap-0.5 text-[11px] font-medium ${deltaColor}`}>
          {isUp && <TrendingUp className="w-2.5 h-2.5" />}
          {isDown && <TrendingDown className="w-2.5 h-2.5" />}
          {isFlat && <Minus className="w-2.5 h-2.5" />}
          {metric.change_pct > 0 ? "+" : ""}
          {metric.change_pct}%
        </span>
        <span className="text-[10px] text-fainter">vs 上周期</span>
      </div>
    </div>
  );
}
