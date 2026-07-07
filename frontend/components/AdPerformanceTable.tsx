"use client";

import { Megaphone, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import type { AdPerformanceRow } from "@/lib/types";

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  profitable: { label: "盈利", cls: "text-up border border-up/30" },
  waste: { label: "无效花费", cls: "text-down border border-down/30" },
  low_conversion: { label: "低转化", cls: "text-warn border border-warn/30" },
  normal: { label: "正常", cls: "text-muted border border-line" },
};

function formatSpend(value: number): string {
  if (value >= 10000) return `$${(value / 10000).toFixed(1)}万`;
  return `$${value.toFixed(0)}`;
}

export default function AdPerformanceTable({ rows }: { rows: AdPerformanceRow[] }) {
  return (
    <div className="bg-panel rounded-md border border-line overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
        <Megaphone className="w-3.5 h-3.5 text-muted" />
        <h3 className="text-[11px] font-semibold text-fg">广告投放表现</h3>
        <span className="text-[10px] text-fainter font-mono ml-auto">ACOS &amp; ROAS</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[9px] font-mono text-fainter tracking-[0.06em] border-b border-line-soft">
              <th className="text-left font-normal py-2.5 px-4">广告活动</th>
              <th className="text-left font-normal py-2.5 px-2">关键词</th>
              <th className="text-right font-normal py-2.5 px-2">展示</th>
              <th className="text-right font-normal py-2.5 px-2">点击</th>
              <th className="text-right font-normal py-2.5 px-2">花费</th>
              <th className="text-right font-normal py-2.5 px-2">销售</th>
              <th className="text-right font-normal py-2.5 px-2">ACOS</th>
              <th className="text-right font-normal py-2.5 px-2">ROAS</th>
              <th className="text-center font-normal py-2.5 px-4">状态</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const config = STATUS_CONFIG[row.status] || STATUS_CONFIG.normal;
              const isWaste = row.status === "waste";
              const isProfitable = row.status === "profitable";
              return (
                <tr
                  key={idx}
                  className="border-b border-line-soft last:border-0 hover:bg-panel-2/50"
                >
                  <td className="py-2.5 px-4 text-xs font-medium text-fg-strong max-w-[120px] truncate">
                    {row.campaign_name}
                  </td>
                  <td className="py-2.5 px-2 text-xs text-muted max-w-[100px] truncate">
                    {row.keyword}
                  </td>
                  <td className="text-right py-2.5 px-2 text-xs text-fg font-mono">
                    {row.impressions.toLocaleString()}
                  </td>
                  <td className="text-right py-2.5 px-2 text-xs text-fg font-mono">
                    {row.clicks}
                  </td>
                  <td
                    className={`text-right py-2.5 px-2 text-xs font-medium font-mono ${
                      isWaste ? "text-down" : "text-fg"
                    }`}
                  >
                    {formatSpend(row.spend)}
                  </td>
                  <td className="text-right py-2.5 px-2 text-xs text-fg font-mono">
                    {row.sales > 0 ? formatSpend(row.sales) : "-"}
                  </td>
                  <td
                    className={`text-right py-2.5 px-2 text-xs font-mono ${
                      row.acos > 50
                        ? "text-down"
                        : row.acos > 25
                        ? "text-warn"
                        : "text-fg"
                    }`}
                  >
                    {row.acos > 0 ? `${row.acos}%` : "-"}
                  </td>
                  <td className="text-right py-2.5 px-2 text-xs font-medium font-mono">
                    <span className="flex items-center justify-end gap-0.5">
                      {isProfitable && <TrendingUp className="w-3 h-3 text-up" />}
                      {isWaste && <TrendingDown className="w-3 h-3 text-down" />}
                      <span
                        className={
                          isProfitable
                            ? "text-up"
                            : isWaste
                            ? "text-down"
                            : "text-fg"
                        }
                      >
                        {row.roas > 0 ? `${row.roas}x` : "-"}
                      </span>
                    </span>
                  </td>
                  <td className="text-center py-2.5 px-4">
                    <span
                      className={`inline-flex items-center gap-0.5 text-[9px] font-mono px-2 py-0.5 rounded-[3px] ${config.cls}`}
                    >
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
