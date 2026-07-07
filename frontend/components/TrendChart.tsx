"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { TrendDataPoint } from "@/lib/types";

type MetricKey = "payment" | "visitors" | "orders" | "exposure";

// 深色终端配色：白/绿/琥珀/紫（低饱和）
const METRIC_OPTIONS: { key: MetricKey; label: string; color: string }[] = [
  { key: "payment", label: "支付金额", color: "#e6e7ea" },
  { key: "visitors", label: "访客人数", color: "#74a98a" },
  { key: "orders", label: "成交订单", color: "#cba45f" },
  { key: "exposure", label: "曝光人数", color: "#a78bce" },
];

interface TrendChartProps {
  data: TrendDataPoint[];
}

export default function TrendChart({ data }: TrendChartProps) {
  const [selected, setSelected] = useState<MetricKey[]>(["payment", "visitors"]);

  const toggleMetric = (key: MetricKey) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const formatYAxis = (value: number) => {
    if (value >= 10000) return `${(value / 10000).toFixed(0)}万`;
    return value.toString();
  };

  const formatTooltip = (value: any, name: any): [string, string] => {
    const v = typeof value === "number" ? value : 0;
    const opt = METRIC_OPTIONS.find((m) => m.label === name);
    const unit =
      opt?.key === "payment"
        ? "元"
        : opt?.key === "exposure" || opt?.key === "visitors"
        ? "人"
        : "单";
    if (v >= 10000) return [`${(v / 10000).toFixed(2)}万${unit}`, name];
    return [`${v.toLocaleString()}${unit}`, name];
  };

  return (
    <div>
      {/* Metric toggles */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {METRIC_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => toggleMetric(opt.key)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium font-mono ${
              selected.includes(opt.key)
                ? "bg-panel-2 border border-line text-fg"
                : "bg-transparent text-fainter hover:text-fg"
            }`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: opt.color }}
            />
            {opt.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            {METRIC_OPTIONS.map((opt) => (
              <linearGradient
                key={opt.key}
                id={`gradient-${opt.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={opt.color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={opt.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1c1e22" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#5a5d64" }}
            interval="preserveStartEnd"
            axisLine={{ stroke: "#23262c" }}
            tickLine={{ stroke: "#23262c" }}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fontSize: 11, fill: "#5a5d64" }}
            axisLine={{ stroke: "#23262c" }}
            tickLine={{ stroke: "#23262c" }}
          />
          <Tooltip
            formatter={formatTooltip}
            contentStyle={{
              borderRadius: "6px",
              border: "1px solid #23262c",
              background: "#131418",
              fontSize: "11px",
              boxShadow: "0 8px 24px -8px rgba(0,0,0,0.6)",
            }}
            labelStyle={{ color: "#e6e7ea" }}
            itemStyle={{ color: "#c8cbd1" }}
            cursor={{ stroke: "#33363d" }}
          />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
          {METRIC_OPTIONS.filter((opt) => selected.includes(opt.key)).map((opt) => (
            <Area
              key={opt.key}
              type="monotone"
              dataKey={opt.key}
              name={opt.label}
              stroke={opt.color}
              strokeWidth={2}
              fill={`url(#gradient-${opt.key})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
