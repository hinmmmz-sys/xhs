"use client";

import { TrendingUp, TrendingDown, Minus, Video, Radio } from "lucide-react";
import type { ChannelDetail } from "@/lib/types";

interface ChannelDetailCardProps {
  channel: ChannelDetail;
  icon: "live" | "video";
}

function formatNum(value: number, unit: string): string {
  if (unit === "元") {
    if (value >= 10000) return `${(value / 10000).toFixed(2)}万`;
    return value.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  }
  if (unit === "%") return value.toFixed(2) + "%";
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  return value.toLocaleString("zh-CN");
}

function ChangeBadge({ pct, trend }: { pct: number; trend: string }) {
  const isUp = trend === "up";
  const isDown = trend === "down";
  const isFlat = trend === "flat";

  return (
    <span
      className={`flex items-center justify-end gap-0.5 text-[11px] font-medium font-mono ${
        isFlat ? "text-fainter" : isUp ? "text-up" : "text-down"
      }`}
    >
      {isUp && <TrendingUp className="w-3 h-3" />}
      {isDown && <TrendingDown className="w-3 h-3" />}
      {isFlat && <Minus className="w-3 h-3" />}
      {pct > 0 ? "+" : ""}
      {pct}%
    </span>
  );
}

function MetricRow({
  label,
  metric,
}: {
  label: string;
  metric: {
    label: string;
    current: number;
    previous: number;
    change_pct: number;
    unit: string;
    trend: string;
  };
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-line-soft last:border-0">
      <span className="text-xs text-faint">{label}</span>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <span className="text-sm font-semibold text-fg-strong tabular font-display">
            {formatNum(metric.current, metric.unit)}
          </span>
          <span className="text-[10px] text-fainter ml-1">{metric.unit}</span>
        </div>
        <div className="w-16 text-right">
          <ChangeBadge pct={metric.change_pct} trend={metric.trend} />
          <p className="text-[10px] text-fainter mt-0.5 font-mono">
            上期 {formatNum(metric.previous, metric.unit)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ChannelDetailCard({ channel, icon }: ChannelDetailCardProps) {
  const Icon = icon === "live" ? Radio : Video;
  const tag = icon === "live" ? "LIVE" : "VIDEO";

  return (
    <div className="bg-panel rounded-md p-4 border border-line">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-md bg-inset border border-line flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-fg" />
        </div>
        <h3 className="text-sm font-semibold text-ink">{channel.name}</h3>
        <span className="ml-auto text-[9px] font-mono text-muted border border-line px-1.5 py-0.5 rounded-[3px]">
          {tag}
        </span>
      </div>

      <div className="space-y-0">
        <MetricRow label="曝光人数" metric={channel.exposure} />
        <MetricRow label="点击人数" metric={channel.clicks} />
        <MetricRow label="访客人数" metric={channel.visitors} />
        <MetricRow label="支付金额" metric={channel.payment} />
        <MetricRow label="成交订单" metric={channel.orders} />
        <MetricRow label="点击支付率" metric={channel.click_payment_rate} />
      </div>
    </div>
  );
}
