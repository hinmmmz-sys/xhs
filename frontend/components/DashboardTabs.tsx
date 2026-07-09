"use client";

import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  DollarSign,
  RotateCcw,
  Bell,
} from "lucide-react";

export type DashboardTab =
  | "overview"
  | "sales"
  | "inventory"
  | "profit"
  | "returns"
  | "alerts";

const TABS: { id: DashboardTab; label: string; icon: typeof LayoutDashboard; desc: string }[] = [
  { id: "overview", label: "总览", icon: LayoutDashboard, desc: "OVERVIEW" },
  { id: "sales", label: "销售", icon: ShoppingCart, desc: "SALES" },
  { id: "inventory", label: "库存", icon: Package, desc: "INVENTORY" },
  { id: "profit", label: "利润", icon: DollarSign, desc: "PROFIT" },
  { id: "returns", label: "退货", icon: RotateCcw, desc: "RETURNS" },
  { id: "alerts", label: "告警", icon: Bell, desc: "ALERTS" },
];

interface DashboardTabsProps {
  active: DashboardTab;
  onChange: (tab: DashboardTab) => void;
  alertCount?: number;
}

export default function DashboardTabs({ active, onChange, alertCount = 0 }: DashboardTabsProps) {
  return (
    <div className="flex items-center gap-0 border-b border-line mb-4 overflow-x-auto">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`group flex items-center gap-2 px-4 py-2.5 border-b-2 whitespace-nowrap ${
              isActive
                ? "border-ink text-ink"
                : "border-transparent text-faint hover:text-fg"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? "text-ink" : "text-fainter"}`} />
            <span className="text-xs font-medium">{tab.label}</span>
            <span className="text-[9px] font-mono text-fainter tracking-[0.1em]">
              {tab.desc}
            </span>
            {tab.id === "alerts" && alertCount > 0 && (
              <span className="ml-0.5 text-[9px] font-bold font-mono bg-down/20 text-down border border-down/30 px-1.5 py-0.5 rounded-full">
                {alertCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
