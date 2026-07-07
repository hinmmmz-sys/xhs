"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { ChannelBreakdownItem } from "@/lib/types";

interface ChannelBarChartProps {
  data: ChannelBreakdownItem[];
}

export default function ChannelBarChart({ data }: ChannelBarChartProps) {
  const formatYAxis = (value: number) => {
    if (value >= 10000) return `${(value / 10000).toFixed(0)}万`;
    return value.toString();
  };

  const formatTooltip = (value: any, name: any): [string, string] => {
    const v = typeof value === "number" ? value : 0;
    const labelMap: Record<string, string> = {
      visitors: "访客",
      payment: "支付金额",
      orders: "订单",
    };
    const unitMap: Record<string, string> = {
      visitors: "人",
      payment: "元",
      orders: "单",
    };
    const key = Object.keys(labelMap).find((k) => labelMap[k] === name) || "";
    const unit = unitMap[key] || "";
    if (v >= 10000) return [`${(v / 10000).toFixed(1)}万${unit}`, name];
    return [`${v.toLocaleString()}${unit}`, name];
  };

  return (
    <div>
      <h3 className="text-[11px] font-semibold text-fg mb-3 flex items-center gap-1.5">
        <span className="w-1 h-3 bg-ink rounded-full" />
        渠道访客对比
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1c1e22" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "#5a5d64" }}
            interval={0}
            angle={-15}
            textAnchor="end"
            height={50}
            axisLine={{ stroke: "#23262c" }}
            tickLine={{ stroke: "#23262c" }}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fontSize: 10, fill: "#5a5d64" }}
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
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
          <Bar
            dataKey="visitors"
            name="访客"
            fill="#8ab4d8"
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
