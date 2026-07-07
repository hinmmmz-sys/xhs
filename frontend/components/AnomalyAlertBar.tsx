"use client";

import { AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { useState } from "react";
import type { AnomalyAlert } from "@/lib/types";

const LEVEL_CONFIG = {
  critical: {
    icon: AlertCircle,
    bg: "bg-red-50/60",
    border: "border-l-red-500",
    text: "text-red-700",
    iconColor: "text-red-500",
    badge: "bg-red-100 text-red-600",
    label: "严重",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-50/60",
    border: "border-l-amber-500",
    text: "text-amber-700",
    iconColor: "text-amber-500",
    badge: "bg-amber-100 text-amber-600",
    label: "预警",
  },
  info: {
    icon: Info,
    bg: "bg-blue-50/60",
    border: "border-l-blue-500",
    text: "text-blue-700",
    iconColor: "text-blue-500",
    badge: "bg-blue-100 text-blue-600",
    label: "提示",
  },
};

export default function AnomalyAlertBar({ alerts }: { alerts: AnomalyAlert[] }) {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  if (alerts.length === 0) return null;

  const visible = alerts.filter((_, i) => !dismissed.has(i));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert, idx) => {
        if (dismissed.has(idx)) return null;
        const config = LEVEL_CONFIG[alert.level];
        const Icon = config.icon;

        return (
          <div
            key={idx}
            className={`flex items-center gap-3 ${config.bg} ${config.border} border-l-2 border-t-0 border-r-0 border-b-0 rounded-r-lg px-3 py-2`}
          >
            <Icon className={`w-4 h-4 ${config.iconColor} flex-shrink-0`} />
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <span className={`text-[10px] font-semibold ${config.badge} px-1.5 py-0.5 rounded flex-shrink-0`}>
                {config.label}
              </span>
              <span className={`text-xs font-medium ${config.text} truncate`}>
                {alert.title}
              </span>
              <span className={`text-xs ${config.text} opacity-60 truncate hidden sm:inline`}>
                {alert.description}
              </span>
            </div>
            <button
              onClick={() => setDismissed((prev) => new Set(prev).add(idx))}
              className="text-slate-400 hover:text-slate-600 flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
