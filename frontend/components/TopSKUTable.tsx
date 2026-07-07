"use client";

import { Package, AlertTriangle, PackageX, CheckCircle } from "lucide-react";
import type { TopSKU } from "@/lib/types";

const STOCK_CONFIG = {
  normal: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50", label: "正常" },
  low: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50", label: "库存低" },
  out: { icon: PackageX, color: "text-red-500", bg: "bg-red-50", label: "缺货" },
};

function formatRevenue(value: number): string {
  if (value >= 10000) return `¥${(value / 10000).toFixed(2)}万`;
  return `¥${value.toLocaleString("zh-CN", { maximumFractionDigits: 0 })}`;
}

export default function TopSKUTable({ skus }: { skus: TopSKU[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-semibold text-gray-700">Top 商品表现</h3>
        <span className="text-xs text-gray-400">· 按收入排序</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left font-medium py-2 px-2">#</th>
              <th className="text-left font-medium py-2 px-2">商品名称</th>
              <th className="text-right font-medium py-2 px-2">销量</th>
              <th className="text-right font-medium py-2 px-2">收入</th>
              <th className="text-right font-medium py-2 px-2">转化率</th>
              <th className="text-center font-medium py-2 px-2">库存</th>
            </tr>
          </thead>
          <tbody>
            {skus.map((sku) => {
              const config = STOCK_CONFIG[sku.stock_status];
              const StockIcon = config.icon;
              return (
                <tr key={sku.sku} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2.5 px-2">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      sku.rank <= 3 ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                    }`}>
                      {sku.rank}
                    </span>
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="font-medium text-gray-700 text-xs">{sku.product_name}</div>
                    <div className="text-xs text-gray-400">{sku.sku}</div>
                  </td>
                  <td className="text-right py-2.5 px-2 text-gray-600">{sku.units}</td>
                  <td className="text-right py-2.5 px-2 font-semibold text-gray-700">{formatRevenue(sku.revenue)}</td>
                  <td className="text-right py-2.5 px-2 text-gray-600">{sku.conversion_rate}%</td>
                  <td className="text-center py-2.5 px-2">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${config.bg} ${config.color}`}>
                      <StockIcon className="w-3 h-3" />
                      {config.label}
                    </span>
                    <div className="text-xs text-gray-400 mt-0.5">{sku.days_of_supply}天</div>
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
