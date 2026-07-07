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
      <Clock className="w-4 h-4 text-gray-400" />
      <div className="flex bg-gray-100 rounded-lg p-1">
        {DATE_RANGES.map((range) => (
          <button
            key={range.value}
            onClick={() => onChange(range.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              value === range.value
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  );
}
