"use client";

import { AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { useState } from "react";
import type { AnomalyAlert } from "@/lib/types";

const LEVEL_CONFIG = {
  critical: {
    icon: AlertCircle,
    tint: "bg-[#141013]",
    badge: "text-down border border-down/30",
    title: "text-[#e8c9c4]",
    desc: "text-[#9a8582]",
    label: "CRITICAL",
  },
  warning: {
    icon: AlertTriangle,
    tint: "bg-[#14120d]",
    badge: "text-warn border border-warn/30",
    title: "text-[#e5d6b5]",
    desc: "text-[#8f8567]",
    label: "WARNING",
  },
  info: {
    icon: Info,
    tint: "bg-inset",
    badge: "text-muted border border-line",
    title: "text-fg",
    desc: "text-faint",
    label: "INFO",
  },
};

export default function AnomalyAlertBar({ alerts }: { alerts: AnomalyAlert[] }) {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  if (alerts.length === 0) return null;

  const visible = alerts.filter((_, i) => !dismissed.has(i));
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-px bg-line border border-line rounded-md overflow-hidden">
      {alerts.map((alert, idx) => {
        if (dismissed.has(idx)) return null;
        const config = LEVEL_CONFIG[alert.level];
        const Icon = config.icon;

        return (
          <div
            key={idx}
            className={`flex items-center gap-3 ${config.tint} px-3.5 py-2.5`}
          >
            <span
              className={`text-[9px] font-semibold font-mono tracking-[0.1em] px-1.5 py-0.5 rounded-[3px] flex-shrink-0 ${config.badge}`}
            >
              {config.label}
            </span>
            <Icon className={`w-3.5 h-3.5 ${config.desc} flex-shrink-0`} />
            <span className={`text-xs font-medium ${config.title} truncate`}>
              {alert.title}
            </span>
            <span className={`text-[11px] font-mono ${config.desc} truncate hidden sm:inline`}>
              {alert.description}
            </span>
            <span className="ml-auto text-[11px] font-mono text-faint hidden md:inline">
              {alert.source} →
            </span>
            <button
              onClick={() => setDismissed((prev) => new Set(prev).add(idx))}
              className="text-fainter hover:text-fg flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
