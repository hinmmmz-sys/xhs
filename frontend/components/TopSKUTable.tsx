"use client";

import { Package, AlertTriangle, PackageX, CheckCircle } from "lucide-react";
import type { TopSKU } from "@/lib/types";

const STOCK_CONFIG = {
  normal: {
    icon: CheckCircle,
    cls: "text-up border border-up/30",
    label: "正常",
  },
  low: {
    icon: AlertTriangle,
    cls: "text-warn border border-warn/30",
    label: "库存低",
  },
  out: {
    icon: PackageX,
    cls: "text-down border border-down/30",
    label: "缺货",
  },
};

function formatRevenue(value: number): string {
  if (value >= 10000) return `¥${(value / 10000).toFixed(2)}万`;
  return `¥${value.toLocaleString("zh-CN", { maximumFractionDigits: 0 })}`;
}

export default function TopSKUTable({ skus }: { skus: TopSKU[] }) {
  return (
    <div className="bg-panel rounded-md border border-line overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
        <Package className="w-3.5 h-3.5 text-muted" />
        <h3 className="text-[11px] font-semibold text-fg">热销商品 TOP SKU</h3>
        <span className="text-[10px] text-fainter font-mono ml-auto">按收入排序</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[9px] font-mono text-fainter tracking-[0.06em] border-b border-line-soft">
              <th className="text-left font-normal py-2.5 px-4">#</th>
              <th className="text-left font-normal py-2.5 px-2">商品名称</th>
              <th className="text-right font-normal py-2.5 px-2">销量</th>
              <th className="text-right font-normal py-2.5 px-2">收入</th>
              <th className="text-right font-normal py-2.5 px-2">转化率</th>
              <th className="text-center font-normal py-2.5 px-4">库存</th>
            </tr>
          </thead>
          <tbody>
            {skus.map((sku) => {
              const config = STOCK_CONFIG[sku.stock_status];
              const StockIcon = config.icon;
              return (
                <tr
                  key={sku.sku}
                  className="border-b border-line-soft last:border-0 hover:bg-panel-2/50"
                >
                  <td className="py-2.5 px-4 text-ink font-mono text-xs">
                    {sku.rank}
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="font-medium text-fg-strong text-xs">
                      {sku.product_name}
                    </div>
                    <div className="text-[9px] text-fainter font-mono">
                      {sku.sku}
                    </div>
                  </td>
                  <td className="text-right py-2.5 px-2 text-fg font-mono text-xs">
                    {sku.units}
                  </td>
                  <td className="text-right py-2.5 px-2 font-semibold text-fg-strong font-mono text-xs">
                    {formatRevenue(sku.revenue)}
                  </td>
                  <td className="text-right py-2.5 px-2 text-fg font-mono text-xs">
                    {sku.conversion_rate}%
                  </td>
                  <td className="text-center py-2.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-[3px] ${config.cls}`}
                    >
                      <StockIcon className="w-3 h-3" />
                      {sku.days_of_supply}天
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
