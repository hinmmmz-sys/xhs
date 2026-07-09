"use client";

import { Package, AlertTriangle, PackageX, CheckCircle, TrendingUp, TrendingDown, Clock, Boxes } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine } from "recharts";
import type { BusinessOverview, TopSKU, TrendDataPoint } from "@/lib/types";
import ExportButton from "./ExportButton";

interface InventoryForecastProps {
  overview: BusinessOverview;
  topSKUs: TopSKU[];
  trend: TrendDataPoint[];
}

export default function InventoryForecast({ overview, topSKUs, trend }: InventoryForecastProps) {
  const stockoutRate = overview.stockout_rate?.current || 0;
  const prevStockoutRate = overview.stockout_rate?.previous || 0;

  // 库存状态分类
  const normalStock = topSKUs.filter((s) => s.stock_status === "normal");
  const lowStock = topSKUs.filter((s) => s.stock_status === "low");
  const outStock = topSKUs.filter((s) => s.stock_status === "out");

  // 按可售天数排序
  const sortedByDays = [...topSKUs].sort((a, b) => a.days_of_supply - b.days_of_supply);

  // 衍生预测：日均销量 → 预计断货日期
  const recentTrend = trend.slice(-7);
  const avgDailyOrders = recentTrend.length > 0
    ? recentTrend.reduce((sum, d) => sum + d.orders, 0) / recentTrend.length
    : 1;

  const forecastData = sortedByDays.map((sku) => {
    const dailySales = sku.units / 7; // 简化：7天销量均值
    const stockoutEstimate = dailySales > 0 ? Math.ceil(sku.days_of_supply / 1) : 999;
    return {
      name: sku.product_name.length > 8 ? sku.product_name.slice(0, 8) + "..." : sku.product_name,
      days: sku.days_of_supply,
      fill: sku.days_of_supply <= 7 ? "#cf7b6f" : sku.days_of_supply <= 14 ? "#cba45f" : "#74a98a",
    };
  });

  const exportData = sortedByDays.map((s) => ({
    SKU: s.sku,
    商品: s.product_name,
    排名: s.rank,
    销量: s.units,
    可售天数: s.days_of_supply,
    库存状态: s.stock_status === "normal" ? "正常" : s.stock_status === "low" ? "偏低" : "缺货",
    转化率: s.conversion_rate + "%",
  }));

  return (
    <div className="space-y-4">
      {/* Inventory KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-panel rounded-md border border-line p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Boxes className="w-3.5 h-3.5 text-fainter" />
            <span className="text-[10px] text-faint font-mono">SKU 总数</span>
          </div>
          <span className="text-2xl font-bold text-ink tabular font-display">{topSKUs.length}</span>
          <div className="text-[10px] text-fainter mt-1 font-mono">
            正常 {normalStock.length} · 偏低 {lowStock.length} · 缺货 {outStock.length}
          </div>
        </div>

        <div className="bg-panel rounded-md border border-line p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <PackageX className="w-3.5 h-3.5 text-down" />
            <span className="text-[10px] text-faint font-mono">缺货率</span>
          </div>
          <span className="text-2xl font-bold text-down tabular font-display">{stockoutRate.toFixed(1)}%</span>
          <div className="flex items-center gap-1 mt-1">
            {stockoutRate > prevStockoutRate ? (
              <span className="text-[10px] text-down font-mono flex items-center gap-0.5">
                <TrendingUp className="w-2.5 h-2.5" />
                +{(stockoutRate - prevStockoutRate).toFixed(1)}%
              </span>
            ) : (
              <span className="text-[10px] text-up font-mono flex items-center gap-0.5">
                <TrendingDown className="w-2.5 h-2.5" />
                {(stockoutRate - prevStockoutRate).toFixed(1)}%
              </span>
            )}
            <span className="text-[10px] text-fainter font-mono">vs {prevStockoutRate.toFixed(1)}%</span>
          </div>
        </div>

        <div className="bg-panel rounded-md border border-line border-l-2 border-l-warn p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-warn" />
            <span className="text-[10px] text-warn font-mono">库存偏低</span>
          </div>
          <span className="text-2xl font-bold text-warn tabular font-display">{lowStock.length}</span>
          <div className="text-[10px] text-fainter mt-1 font-mono">
            需关注 · 可售 < 14天
          </div>
        </div>

        <div className="bg-panel rounded-md border border-line border-l-2 border-l-down p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <PackageX className="w-3.5 h-3.5 text-down" />
            <span className="text-[10px] text-down font-mono">已缺货</span>
          </div>
          <span className="text-2xl font-bold text-down tabular font-display">{outStock.length}</span>
          <div className="text-[10px] text-fainter mt-1 font-mono">
            需立即补货
          </div>
        </div>
      </div>

      {/* Days of Supply Chart */}
      <div className="bg-panel rounded-md border border-line p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-3 bg-ink rounded-full" />
            <span className="text-[11px] font-semibold text-fg">可售天数预测</span>
            <span className="text-[10px] text-fainter font-mono">FBA Days of Cover</span>
          </div>
          <ExportButton data={exportData} filename="inventory-forecast" />
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={forecastData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1c1e22" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: "#5a5d64" }}
              axisLine={{ stroke: "#23262c" }}
              tickLine={{ stroke: "#23262c" }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 10, fill: "#7f8288" }}
              axisLine={{ stroke: "#23262c" }}
              tickLine={{ stroke: "#23262c" }}
              width={80}
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
              formatter={(value: any) => [`${value} 天`, "可售天数"]}
            />
            <ReferenceLine x={7} stroke="#cf7b6f" strokeDasharray="4 4" label={{ value: "危险线 7天", fill: "#cf7b6f", fontSize: 9, position: "top" }} />
            <ReferenceLine x={14} stroke="#cba45f" strokeDasharray="4 4" label={{ value: "警戒线 14天", fill: "#cba45f", fontSize: 9, position: "top" }} />
            <Bar dataKey="days" radius={[0, 3, 3, 0]} maxBarSize={20}>
              {forecastData.map((entry, idx) => (
                <Cell key={idx} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Inventory Status Table */}
      <div className="bg-panel rounded-md border border-line overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
          <Package className="w-3.5 h-3.5 text-muted" />
          <h3 className="text-[11px] font-semibold text-fg">库存状态明细</h3>
          <span className="text-[10px] text-fainter font-mono ml-auto">按可售天数升序</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[9px] font-mono text-fainter tracking-[0.06em] border-b border-line-soft">
                <th className="text-left font-normal py-2.5 px-4">#</th>
                <th className="text-left font-normal py-2.5 px-2">商品名称</th>
                <th className="text-right font-normal py-2.5 px-2">销量</th>
                <th className="text-right font-normal py-2.5 px-2">收入</th>
                <th className="text-right font-normal py-2.5 px-2">可售天数</th>
                <th className="text-center font-normal py-2.5 px-4">库存状态</th>
              </tr>
            </thead>
            <tbody>
              {sortedByDays.map((sku, idx) => {
                const config = {
                  normal: { icon: CheckCircle, cls: "text-up border border-up/30", label: "正常" },
                  low: { icon: AlertTriangle, cls: "text-warn border border-warn/30", label: "库存低" },
                  out: { icon: PackageX, cls: "text-down border border-down/30", label: "缺货" },
                };
                const configItem = config[sku.stock_status];
                const StockIcon = configItem.icon;
                return (
                  <tr key={sku.sku} className="border-b border-line-soft last:border-0 hover:bg-panel-2/50">
                    <td className="py-2.5 px-4 text-ink font-mono text-xs">{idx + 1}</td>
                    <td className="py-2.5 px-2">
                      <div className="font-medium text-fg-strong text-xs">{sku.product_name}</div>
                      <div className="text-[9px] text-fainter font-mono">{sku.sku}</div>
                    </td>
                    <td className="text-right py-2.5 px-2 text-fg font-mono text-xs">{sku.units}</td>
                    <td className="text-right py-2.5 px-2 font-semibold text-fg-strong font-mono text-xs">
                      {sku.revenue >= 10000 ? `¥${(sku.revenue / 10000).toFixed(1)}万` : `¥${sku.revenue.toLocaleString()}`}
                    </td>
                    <td className={`text-right py-2.5 px-2 font-mono text-xs font-bold ${sku.days_of_supply <= 7 ? "text-down" : sku.days_of_supply <= 14 ? "text-warn" : "text-fg"}`}>
                      {sku.days_of_supply}天
                    </td>
                    <td className="text-center py-2.5 px-4">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded ${configItem.cls}`}>
                        <StockIcon className="w-3 h-3" />
                        {configItem.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Replenishment Suggestions */}
      {(lowStock.length > 0 || outStock.length > 0) && (
        <div className="bg-panel rounded-md border border-warn/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-3.5 h-3.5 text-warn" />
            <h3 className="text-[11px] font-semibold text-warn">补货建议</h3>
            <span className="text-[10px] text-fainter font-mono">基于当前销售速度推算</span>
          </div>
          <div className="space-y-2">
            {[...outStock, ...lowStock].map((sku) => (
              <div key={sku.sku} className="flex items-center justify-between bg-inset border border-line-soft rounded-md px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${sku.stock_status === "out" ? "bg-down" : "bg-warn"}`} />
                  <span className="text-xs text-fg-strong">{sku.product_name}</span>
                  <span className="text-[10px] text-fainter font-mono">{sku.sku}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="text-faint">日销 {Math.ceil(sku.units / 7)}件</span>
                  <span className="text-faint">可售 {sku.days_of_supply}天</span>
                  <span className={sku.stock_status === "out" ? "text-down font-semibold" : "text-warn font-semibold"}>
                    {sku.stock_status === "out" ? "立即补货" : "建议补货"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
