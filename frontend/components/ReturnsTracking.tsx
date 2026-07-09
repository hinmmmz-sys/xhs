"use client";

import { RotateCcw, TrendingUp, TrendingDown, AlertTriangle, DollarSign, Percent } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import type { BusinessOverview, TopSKU, TrendDataPoint } from "@/lib/types";
import ExportButton from "./ExportButton";

interface ReturnsTrackingProps {
  overview: BusinessOverview;
  trend: TrendDataPoint[];
  topSKUs: TopSKU[];
}

export default function ReturnsTracking({ overview, trend, topSKUs }: ReturnsTrackingProps) {
  const refundAmount = overview.refund_amount?.current || 0;
  const refundRate = overview.refund_rate?.current || 0;
  const prevRefundRate = overview.refund_rate?.previous || 0;
  const prevRefundAmount = overview.refund_amount?.previous || 0;
  const revenue = overview.total_payment.current;
  const orders = overview.order_count?.current || 0;
  const estimatedReturnOrders = orders > 0 ? Math.round(orders * refundRate / 100) : 0;
  const avgRefundPerOrder = estimatedReturnOrders > 0 ? refundAmount / estimatedReturnOrders : 0;

  // 退货趋势（用订单数模拟退货量趋势）
  const returnTrend = trend.map((d) => ({
    date: d.date,
    refundAmount: d.payment * refundRate / 100,
    orders: d.orders,
  }));

  // 按退货风险排序的 SKU
  const skuReturnRisk = topSKUs
    .map((sku) => ({
      ...sku,
      estimatedReturns: Math.round(sku.units * refundRate / 100),
      estimatedRefund: sku.revenue * refundRate / 100,
    }))
    .sort((a, b) => b.estimatedRefund - a.estimatedRefund);

  const exportData = skuReturnRisk.map((s) => ({
    SKU: s.sku,
    商品: s.product_name,
    销量: s.units,
    预估退货: s.estimatedReturns,
    预估退款: s.estimatedRefund.toFixed(2),
    退货率: refundRate.toFixed(2) + "%",
  }));

  return (
    <div className="space-y-4">
      {/* Return KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-panel rounded-md border border-line p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <RotateCcw className="w-3.5 h-3.5 text-down" />
            <span className="text-[10px] text-faint font-mono">退货率</span>
          </div>
          <span className="text-2xl font-bold text-down tabular font-display">{refundRate.toFixed(2)}%</span>
          <div className="flex items-center gap-1 mt-1">
            {refundRate > prevRefundRate ? (
              <span className="text-[10px] text-down font-mono flex items-center gap-0.5">
                <TrendingUp className="w-2.5 h-2.5" />
                +{(refundRate - prevRefundRate).toFixed(2)}%
              </span>
            ) : (
              <span className="text-[10px] text-up font-mono flex items-center gap-0.5">
                <TrendingDown className="w-2.5 h-2.5" />
                {(refundRate - prevRefundRate).toFixed(2)}%
              </span>
            )}
            <span className="text-[10px] text-fainter font-mono">vs {prevRefundRate.toFixed(2)}%</span>
          </div>
        </div>

        <div className="bg-panel rounded-md border border-line p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <DollarSign className="w-3.5 h-3.5 text-down" />
            <span className="text-[10px] text-faint font-mono">退款金额</span>
          </div>
          <span className="text-2xl font-bold text-down tabular font-display">
            ¥{refundAmount.toLocaleString()}
          </span>
          <div className="text-[10px] text-fainter mt-1 font-mono">
            vs ¥{prevRefundAmount.toLocaleString()}
          </div>
        </div>

        <div className="bg-panel rounded-md border border-line p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Percent className="w-3.5 h-3.5 text-fainter" />
            <span className="text-[10px] text-faint font-mono">预估退货订单</span>
          </div>
          <span className="text-2xl font-bold text-ink tabular font-display">{estimatedReturnOrders}</span>
          <div className="text-[10px] text-fainter mt-1 font-mono">
            总 {orders} 单 × {refundRate.toFixed(1)}%
          </div>
        </div>

        <div className="bg-panel rounded-md border border-line p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <DollarSign className="w-3.5 h-3.5 text-fainter" />
            <span className="text-[10px] text-faint font-mono">单笔退款均值</span>
          </div>
          <span className="text-2xl font-bold text-ink tabular font-display">
            ¥{avgRefundPerOrder.toFixed(2)}
          </span>
          <div className="text-[10px] text-fainter mt-1 font-mono">
            退款 / 退货订单
          </div>
        </div>
      </div>

      {/* Return Trend Chart */}
      <div className="bg-panel rounded-md border border-line p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <span className="w-1 h-3 bg-down rounded-full" />
          <span className="text-[11px] font-semibold text-fg">退款金额趋势</span>
          <span className="text-[10px] text-fainter font-mono">· {overview.date_range_label}</span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={returnTrend} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="refundGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#cf7b6f" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#cf7b6f" stopOpacity={0} />
              </linearGradient>
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
              cursor={{ stroke: "#33363d" }}
              formatter={(value: any, name: any) => {
                if (name === "退款金额") return [`¥${Number(value).toLocaleString()}`, name];
                return [value, name];
              }}
            />
            <Area
              type="monotone"
              dataKey="refundAmount"
              name="退款金额"
              stroke="#cf7b6f"
              strokeWidth={2}
              fill="url(#refundGradient)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Return Risk by SKU */}
      <div className="bg-panel rounded-md border border-line overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-warn" />
            <h3 className="text-[11px] font-semibold text-fg">SKU 退货风险分析</h3>
            <span className="text-[10px] text-fainter font-mono">基于整体退货率推算</span>
          </div>
          <ExportButton data={exportData} filename="returns-by-sku" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[9px] font-mono text-fainter tracking-[0.06em] border-b border-line-soft">
                <th className="text-left font-normal py-2.5 px-4">#</th>
                <th className="text-left font-normal py-2.5 px-2">商品名称</th>
                <th className="text-right font-normal py-2.5 px-2">销量</th>
                <th className="text-right font-normal py-2.5 px-2">预估退货</th>
                <th className="text-right font-normal py-2.5 px-2">预估退款</th>
                <th className="text-right font-normal py-2.5 px-4">风险等级</th>
              </tr>
            </thead>
            <tbody>
              {skuReturnRisk.map((sku, idx) => {
                const riskLevel = sku.estimatedRefund > refundAmount * 0.3 ? "high" : sku.estimatedRefund > refundAmount * 0.1 ? "medium" : "low";
                const riskConfig = {
                  high: { label: "高风险", cls: "text-down border border-down/30" },
                  medium: { label: "中风险", cls: "text-warn border border-warn/30" },
                  low: { label: "低风险", cls: "text-up border border-up/30" },
                };
                const risk = riskConfig[riskLevel];
                return (
                  <tr key={sku.sku} className="border-b border-line-soft last:border-0 hover:bg-panel-2/50">
                    <td className="py-2.5 px-4 text-ink font-mono text-xs">{idx + 1}</td>
                    <td className="py-2.5 px-2">
                      <div className="font-medium text-fg-strong text-xs">{sku.product_name}</div>
                      <div className="text-[9px] text-fainter font-mono">{sku.sku}</div>
                    </td>
                    <td className="text-right py-2.5 px-2 text-fg font-mono text-xs">{sku.units}</td>
                    <td className="text-right py-2.5 px-2 text-warn font-mono text-xs">{sku.estimatedReturns}</td>
                    <td className="text-right py-2.5 px-2 text-down font-mono text-xs">¥{sku.estimatedRefund.toFixed(0)}</td>
                    <td className="text-center py-2.5 px-4">
                      <span className={`inline-flex items-center gap-0.5 text-[9px] font-mono px-2 py-0.5 rounded ${risk.cls}`}>
                        {risk.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
