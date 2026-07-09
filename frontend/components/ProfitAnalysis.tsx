"use client";

import { DollarSign, TrendingUp, TrendingDown, Percent, Target } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import type { BusinessOverview, AdPerformanceRow } from "@/lib/types";
import ExportButton from "./ExportButton";

interface ProfitAnalysisProps {
  overview: BusinessOverview;
  adRows: AdPerformanceRow[];
}

export default function ProfitAnalysis({ overview, adRows }: ProfitAnalysisProps) {
  const revenue = overview.total_payment.current;
  const refundAmount = overview.refund_amount?.current || 0;
  const adSpend = adRows.reduce((sum, r) => sum + r.spend, 0);
  const estimatedCost = revenue * 0.55;
  const netProfit = revenue - estimatedCost - adSpend - refundAmount;
  const grossMargin = revenue > 0 ? ((revenue - estimatedCost) / revenue) * 100 : 0;
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const roas = adSpend > 0 ? revenue / adSpend : 0;

  const profitData = [
    { name: "总收入", value: revenue, fill: "#e6e7ea" },
    { name: "商品成本", value: -estimatedCost, fill: "#cf7b6f" },
    { name: "广告花费", value: -adSpend, fill: "#cba45f" },
    { name: "退款", value: -refundAmount, fill: "#cf7b6f" },
    { name: "净利润", value: netProfit, fill: "#74a98a" },
  ];

  const exportData = [
    { 指标: "总收入", 金额: revenue.toFixed(2) },
    { 指标: "商品成本", 金额: estimatedCost.toFixed(2) },
    { 指标: "广告花费", 金额: adSpend.toFixed(2) },
    { 指标: "退款金额", 金额: refundAmount.toFixed(2) },
    { 指标: "净利润", 金额: netProfit.toFixed(2) },
    { 指标: "毛利率(%)", 金额: grossMargin.toFixed(2) },
    { 指标: "净利率(%)", 金额: netMargin.toFixed(2) },
    { 指标: "ROAS", 金额: roas.toFixed(2) },
  ];

  return (
    <div className="space-y-4">
      {/* Profit KPI Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-panel rounded-md border border-line p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <DollarSign className="w-3.5 h-3.5 text-fainter" />
            <span className="text-[10px] text-faint font-mono">总收入</span>
          </div>
          <span className="text-2xl font-bold text-ink tabular font-display">
            {revenue >= 10000 ? `${(revenue / 10000).toFixed(2)}万` : `¥${revenue.toLocaleString()}`}
          </span>
          <div className="text-[10px] text-fainter mt-1 font-mono">
            vs {overview.total_payment.previous.toLocaleString()}
          </div>
        </div>

        <div className="bg-panel rounded-md border border-line p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingDown className="w-3.5 h-3.5 text-down" />
            <span className="text-[10px] text-faint font-mono">总成本</span>
          </div>
          <span className="text-2xl font-bold text-down tabular font-display">
            -¥{(estimatedCost + adSpend + refundAmount).toLocaleString()}
          </span>
          <div className="text-[10px] text-fainter mt-1 font-mono">
            成本{(estimatedCost / revenue * 100).toFixed(0)}% + 广告 + 退款
          </div>
        </div>

        <div className="bg-panel rounded-md border border-line border-l-2 border-l-up p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-up" />
            <span className="text-[10px] text-up font-mono">净利润</span>
          </div>
          <span className={`text-2xl font-bold tabular font-display ${netProfit > 0 ? "text-up" : "text-down"}`}>
            {netProfit >= 0 ? "+" : ""}¥{netProfit.toLocaleString()}
          </span>
          <div className="text-[10px] text-fainter mt-1 font-mono">
            {netProfit >= 0 ? "盈利" : "亏损"}
          </div>
        </div>

        <div className="bg-panel rounded-md border border-line p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Percent className="w-3.5 h-3.5 text-fainter" />
            <span className="text-[10px] text-faint font-mono">净利率</span>
          </div>
          <span className={`text-2xl font-bold tabular font-display ${netMargin > 0 ? "text-up" : "text-down"}`}>
            {netMargin.toFixed(1)}%
          </span>
          <div className="text-[10px] text-fainter mt-1 font-mono">
            毛利{grossMargin.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Profit Waterfall Chart */}
      <div className="bg-panel rounded-md border border-line p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-3 bg-ink rounded-full" />
            <span className="text-[11px] font-semibold text-fg">利润瀑布图</span>
            <span className="text-[10px] text-fainter font-mono">收入 → 扣除成本 → 净利润</span>
          </div>
          <ExportButton data={exportData} filename="profit-analysis" />
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={profitData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1c1e22" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#5a5d64" }}
              axisLine={{ stroke: "#23262c" }}
              tickLine={{ stroke: "#23262c" }}
            />
            <YAxis
              tickFormatter={(v) => v >= 10000 ? `${(v / 10000).toFixed(0)}万` : v.toLocaleString()}
              tick={{ fontSize: 10, fill: "#5a5d64" }}
              axisLine={{ stroke: "#23262c" }}
              tickLine={{ stroke: "#23262c" }}
            />
            <Tooltip
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
              formatter={(value: any) => `¥${Number(value).toLocaleString()}`}
            />
            <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={48}>
              {profitData.map((entry, idx) => (
                <Cell key={idx} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ROAS & Efficiency */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel rounded-md border border-line p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Target className="w-3.5 h-3.5 text-fainter" />
            <span className="text-[10px] text-faint font-mono">广告 ROAS</span>
          </div>
          <span className={`text-2xl font-bold tabular font-display ${roas >= 3 ? "text-up" : roas >= 1 ? "text-warn" : "text-down"}`}>
            {roas.toFixed(2)}x
          </span>
          <div className="text-[10px] text-fainter mt-1 font-mono">
            花费 ¥{adSpend.toLocaleString()} → 收入 ¥{revenue.toLocaleString()}
          </div>
        </div>

        <div className="bg-panel rounded-md border border-line p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <DollarSign className="w-3.5 h-3.5 text-fainter" />
            <span className="text-[10px] text-faint font-mono">客单价 AOV</span>
          </div>
          <span className="text-2xl font-bold text-ink tabular font-display">
            ¥{overview.aov?.current.toFixed(2) || "0.00"}
          </span>
          <div className="text-[10px] text-fainter mt-1 font-mono">
            {overview.order_count?.current || 0} 单
          </div>
        </div>

        <div className="bg-panel rounded-md border border-line p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-fainter" />
            <span className="text-[10px] text-faint font-mono">单件利润</span>
          </div>
          <span className={`text-2xl font-bold tabular font-display ${(netProfit / (overview.order_count?.current || 1)) > 0 ? "text-up" : "text-down"}`}>
            ¥{(netProfit / (overview.order_count?.current || 1)).toFixed(2)}
          </span>
          <div className="text-[10px] text-fainter mt-1 font-mono">
            净利润 / 订单数
          </div>
        </div>
      </div>
    </div>
  );
}
