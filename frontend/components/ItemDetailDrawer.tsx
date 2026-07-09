"use client";

import { useState } from "react";
import { X, Package, TrendingUp, TrendingDown, ShoppingCart, DollarSign, AlertTriangle, PackageX, CheckCircle, BarChart3 } from "lucide-react";
import type { TopSKU, AdPerformanceRow, TrendDataPoint } from "@/lib/types";

interface ItemDetailDrawerProps {
  sku: TopSKU | null;
  adRows?: AdPerformanceRow[];
  trend?: TrendDataPoint[];
  onClose: () => void;
}

export default function ItemDetailDrawer({ sku, adRows = [], trend = [], onClose }: ItemDetailDrawerProps) {
  if (!sku) return null;

  const itemAds = adRows.filter((r) => r.keyword && sku.product_name.includes(r.keyword.slice(0, 2)));
  const stockConfig = {
    normal: { icon: CheckCircle, cls: "text-up border border-up/30", label: "库存正常" },
    low: { icon: AlertTriangle, cls: "text-warn border border-warn/30", label: "库存偏低" },
    out: { icon: PackageX, cls: "text-down border border-down/30", label: "已缺货" },
  };
  const config = stockConfig[sku.stock_status];
  const StockIcon = config.icon;

  // 衍生利润指标
  const revenue = sku.revenue;
  const estimatedCost = revenue * 0.55; // 假设55%成本率
  const estimatedAdSpend = itemAds.reduce((sum, r) => sum + r.spend, 0);
  const netProfit = revenue - estimatedCost - estimatedAdSpend;
  const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  // 衍生趋势（简化：用 trend 数据的最后7天）
  const recentTrend = trend.slice(-7);
  const avgDailySales = recentTrend.length > 0
    ? recentTrend.reduce((sum, d) => sum + d.orders, 0) / recentTrend.length
    : 0;
  const projectedStockoutDays = avgDailySales > 0 ? Math.ceil(sku.days_of_supply / avgDailySales) : sku.days_of_supply;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-screen w-[480px] bg-sidebar border-l border-line z-50 overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-line sticky top-0 bg-sidebar z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-inset border border-line flex items-center justify-center">
                <Package className="w-4 h-4 text-fg" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-ink font-display">{sku.product_name}</h2>
                <p className="text-[10px] text-fainter font-mono">{sku.sku}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-fainter hover:text-fg p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded ${config.cls}`}>
              <StockIcon className="w-3 h-3" />
              {config.label}
            </span>
            <span className="text-[9px] font-mono text-muted border border-line px-1.5 py-0.5 rounded">
              RANK #{sku.rank}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Core Metrics */}
          <div>
            <div className="text-[9px] font-mono text-fainter uppercase tracking-[0.16em] mb-2">核心指标 · CORE</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-panel border border-line rounded-md p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <ShoppingCart className="w-3 h-3 text-fainter" />
                  <span className="text-[10px] text-faint font-mono">销量</span>
                </div>
                <span className="text-lg font-bold text-ink tabular font-display">{sku.units}</span>
                <span className="text-[10px] text-fainter ml-1">件</span>
              </div>
              <div className="bg-panel border border-line rounded-md p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <DollarSign className="w-3 h-3 text-fainter" />
                  <span className="text-[10px] text-faint font-mono">收入</span>
                </div>
                <span className="text-lg font-bold text-ink tabular font-display">
                  {sku.revenue >= 10000 ? `${(sku.revenue / 10000).toFixed(2)}万` : `¥${sku.revenue.toLocaleString()}`}
                </span>
              </div>
              <div className="bg-panel border border-line rounded-md p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-3 h-3 text-fainter" />
                  <span className="text-[10px] text-faint font-mono">转化率</span>
                </div>
                <span className="text-lg font-bold text-ink tabular font-display">{sku.conversion_rate}%</span>
              </div>
              <div className="bg-panel border border-line rounded-md p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Package className="w-3 h-3 text-fainter" />
                  <span className="text-[10px] text-faint font-mono">可售天数</span>
                </div>
                <span className={`text-lg font-bold tabular font-display ${sku.days_of_supply <= 7 ? "text-down" : sku.days_of_supply <= 14 ? "text-warn" : "text-ink"}`}>
                  {sku.days_of_supply}
                </span>
                <span className="text-[10px] text-fainter ml-1">天</span>
              </div>
            </div>
          </div>

          {/* Profit Analysis */}
          <div>
            <div className="text-[9px] font-mono text-fainter uppercase tracking-[0.16em] mb-2">利润分析 · PROFIT</div>
            <div className="bg-panel border border-line rounded-md p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-faint">总收入</span>
                <span className="text-xs font-semibold text-fg-strong font-mono">¥{revenue.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-faint">商品成本 (55%)</span>
                <span className="text-xs text-down font-mono">-¥{estimatedCost.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-faint">广告花费</span>
                <span className="text-xs text-down font-mono">-¥{estimatedAdSpend.toLocaleString()}</span>
              </div>
              <div className="border-t border-line-soft pt-2.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-fg">净利润</span>
                <div className="text-right">
                  <span className={`text-base font-bold tabular font-display ${netProfit > 0 ? "text-up" : "text-down"}`}>
                    {netProfit >= 0 ? "+" : ""}¥{netProfit.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-fainter ml-1 font-mono">({profitMargin.toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Forecast */}
          <div>
            <div className="text-[9px] font-mono text-fainter uppercase tracking-[0.16em] mb-2">库存预测 · FORECAST</div>
            <div className="bg-panel border border-line rounded-md p-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[10px] text-faint font-mono mb-1">日均销量</p>
                  <p className="text-sm font-bold text-ink tabular font-display">{avgDailySales.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-faint font-mono mb-1">可售天数</p>
                  <p className={`text-sm font-bold tabular font-display ${sku.days_of_supply <= 7 ? "text-down" : "text-ink"}`}>
                    {sku.days_of_supply}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-faint font-mono mb-1">预计断货</p>
                  <p className={`text-sm font-bold tabular font-display ${projectedStockoutDays <= 7 ? "text-down" : "text-warn"}`}>
                    {projectedStockoutDays}天后
                  </p>
                </div>
              </div>
              {sku.days_of_supply <= 7 && (
                <div className="mt-3 flex items-center gap-2 bg-down/10 border border-down/20 rounded-md px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-down flex-shrink-0" />
                  <span className="text-[11px] text-down">
                    该商品库存紧张，建议尽快补货！当前可售天数低于安全库存线。
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Related Ads */}
          {itemAds.length > 0 && (
            <div>
              <div className="text-[9px] font-mono text-fainter uppercase tracking-[0.16em] mb-2">关联广告 · ADS</div>
              <div className="bg-panel border border-line rounded-md overflow-hidden">
                {itemAds.map((ad, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3 py-2.5 border-b border-line-soft last:border-0">
                    <div className="min-w-0">
                      <p className="text-xs text-fg-strong truncate">{ad.campaign_name}</p>
                      <p className="text-[10px] text-fainter font-mono">{ad.keyword}</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="text-[10px] text-fainter font-mono">花费</p>
                        <p className="text-xs text-fg font-mono">¥{ad.spend}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-fainter font-mono">ROAS</p>
                        <p className={`text-xs font-mono ${ad.roas >= 3 ? "text-up" : ad.roas >= 1 ? "text-warn" : "text-down"}`}>
                          {ad.roas}x
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <div className="text-[9px] font-mono text-fainter uppercase tracking-[0.16em] mb-2">快捷操作 · ACTIONS</div>
            <div className="grid grid-cols-2 gap-2">
              <button className="bg-panel border border-line rounded-md py-2 text-[11px] text-fg hover:bg-panel-2 hover:border-[#2f333b] flex items-center justify-center gap-1.5">
                <BarChart3 className="w-3 h-3" />
                查看历史趋势
              </button>
              <button className="bg-panel border border-line rounded-md py-2 text-[11px] text-fg hover:bg-panel-2 hover:border-[#2f333b] flex items-center justify-center gap-1.5">
                <Package className="w-3 h-3" />
                创建补货计划
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
