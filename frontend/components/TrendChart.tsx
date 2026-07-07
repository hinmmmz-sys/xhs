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

const METRIC_OPTIONS: { key: MetricKey; label: string; color: string }[] = [
  { key: "payment", label: "支付金额", color: "#3b82f6" },
  { key: "visitors", label: "访客人数", color: "#10b981" },
  { key: "orders", label: "成交订单", color: "#f59e0b" },
  { key: "exposure", label: "曝光人数", color: "#8b5cf6" },
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
    const unit = opt?.key === "payment" ? "元" : opt?.key === "exposure" || opt?.key === "visitors" ? "人" : "单";
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
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium ${
              selected.includes(opt.key)
                ? "bg-slate-100 border border-slate-200 text-slate-700"
                : "bg-transparent text-slate-400 hover:text-slate-600"
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
              <linearGradient key={opt.key} id={`gradient-${opt.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={opt.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={opt.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
          />
          <Tooltip
            formatter={formatTooltip}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              fontSize: "11px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
            }}
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
