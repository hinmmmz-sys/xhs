"use client";

import { Clock } from "lucide-react";

const DATE_RANGES = [
  { value: "realtime", label: "实时" },
  { value: "1d", label: "近1天" },
  { value: "7d", label: "近7天" },
  { value: "30d", label: "近30天" },
];

interface DateRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Clock className="w-4 h-4 text-fainter" />
      <div className="flex bg-panel border border-line rounded-md p-0.5 font-mono">
        {DATE_RANGES.map((range) => (
          <button
            key={range.value}
            onClick={() => onChange(range.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-[5px] ${
              value === range.value
                ? "bg-panel-2 text-ink"
                : "text-faint hover:text-fg"
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  );
}
