"use client";

import { Megaphone, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import type { AdPerformanceRow } from "@/lib/types";

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  profitable: { label: "盈利", bg: "bg-green-50", color: "text-green-600" },
  waste: { label: "无效花费", bg: "bg-red-50", color: "text-red-600" },
  low_conversion: { label: "低转化", bg: "bg-amber-50", color: "text-amber-600" },
  normal: { label: "正常", bg: "bg-gray-50", color: "text-gray-500" },
};

function formatSpend(value: number): string {
  if (value >= 10000) return `$${(value / 10000).toFixed(1)}万`;
  return `$${value.toFixed(0)}`;
}

export default function AdPerformanceTable({ rows }: { rows: AdPerformanceRow[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="w-4 h-4 text-purple-500" />
        <h3 className="text-sm font-semibold text-gray-700">广告投放表现</h3>
        <span className="text-xs text-gray-400">· ACOS & ROAS</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left font-medium py-2 px-2">广告活动</th>
              <th className="text-left font-medium py-2 px-2">关键词</th>
              <th className="text-right font-medium py-2 px-2">展示</th>
              <th className="text-right font-medium py-2 px-2">点击</th>
              <th className="text-right font-medium py-2 px-2">花费</th>
              <th className="text-right font-medium py-2 px-2">销售</th>
              <th className="text-right font-medium py-2 px-2">ACOS</th>
              <th className="text-right font-medium py-2 px-2">ROAS</th>
              <th className="text-center font-medium py-2 px-2">状态</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const config = STATUS_CONFIG[row.status] || STATUS_CONFIG.normal;
              const isWaste = row.status === "waste";
              const isProfitable = row.status === "profitable";
              return (
                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2.5 px-2 text-xs font-medium text-gray-700 max-w-[120px] truncate">
                    {row.campaign_name}
                  </td>
                  <td className="py-2.5 px-2 text-xs text-gray-500 max-w-[100px] truncate">
                    {row.keyword}
                  </td>
                  <td className="text-right py-2.5 px-2 text-xs text-gray-600">{row.impressions.toLocaleString()}</td>
                  <td className="text-right py-2.5 px-2 text-xs text-gray-600">{row.clicks}</td>
                  <td className={`text-right py-2.5 px-2 text-xs font-medium ${isWaste ? "text-red-600" : "text-gray-700"}`}>
                    {formatSpend(row.spend)}
                  </td>
                  <td className="text-right py-2.5 px-2 text-xs text-gray-600">
                    {row.sales > 0 ? formatSpend(row.sales) : "-"}
                  </td>
                  <td className={`text-right py-2.5 px-2 text-xs ${row.acos > 50 ? "text-red-500" : row.acos > 25 ? "text-amber-500" : "text-gray-600"}`}>
                    {row.acos > 0 ? `${row.acos}%` : "-"}
                  </td>
                  <td className={`text-right py-2.5 px-2 text-xs font-medium flex items-center justify-end gap-0.5`}>
                    {isProfitable && <TrendingUp className="w-3 h-3 text-green-500" />}
                    {isWaste && <TrendingDown className="w-3 h-3 text-red-500" />}
                    <span className={isProfitable ? "text-green-600" : isWaste ? "text-red-600" : "text-gray-600"}>
                      {row.roas > 0 ? `${row.roas}x` : "-"}
                    </span>
                  </td>
                  <td className="text-center py-2.5 px-2">
                    <span className={`inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded ${config.bg} ${config.color}`}>
                      {isWaste && <AlertCircle className="w-3 h-3" />}
                      {config.label}
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
