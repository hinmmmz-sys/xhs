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
      className={`flex items-center gap-0.5 text-xs font-medium ${
        isFlat
          ? "text-gray-400"
          : isUp
          ? "text-green-600"
          : "text-red-500"
      }`}
    >
      {isUp && <TrendingUp className="w-3 h-3" />}
      {isDown && <TrendingDown className="w-3 h-3" />}
      {isFlat && <Minus className="w-3 h-3" />}
      {pct > 0 ? "+" : ""}{pct}%
    </span>
  );
}

function MetricRow({ label, metric }: { label: string; metric: { label: string; current: number; previous: number; change_pct: number; unit: string; trend: string } }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <span className="text-sm font-semibold text-gray-800">
            {formatNum(metric.current, metric.unit)}
          </span>
          <span className="text-xs text-gray-400 ml-1">{metric.unit}</span>
        </div>
        <div className="w-16 text-right">
          <ChangeBadge pct={metric.change_pct} trend={metric.trend} />
          <p className="text-xs text-gray-300 mt-0.5">
            上期 {formatNum(metric.previous, metric.unit)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ChannelDetailCard({ channel, icon }: ChannelDetailCardProps) {
  const Icon = icon === "live" ? Radio : Video;
  const gradient = icon === "live"
    ? "from-red-500 to-orange-500"
    : "from-purple-500 to-pink-500";

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-base font-semibold text-gray-800">{channel.name}</h3>
      </div>

      <div className="space-y-1">
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
