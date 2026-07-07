"use client";

import Link from "next/link";
import { FileText, AlertCircle, Clock } from "lucide-react";
import type { ReportListItem } from "@/lib/types";

export default function ReportCard({ report }: { report: ReportListItem }) {
  return (
    <Link
      href={`/reports/${report.id}`}
      className="block bg-panel rounded-md hover:border-[#2f333b] p-4 border border-line"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted" />
          <h3 className="text-xs font-semibold text-fg-strong">{report.title}</h3>
        </div>
        {report.ai_powered ? (
          <span className="text-[9px] font-mono text-ai border border-ai/30 px-1.5 py-0.5 rounded-[3px]">
            ✦ AI
          </span>
        ) : (
          <span className="text-[9px] font-mono text-muted border border-line px-1.5 py-0.5 rounded-[3px]">
            模板
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 text-[10px] text-faint mb-3 font-mono">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {report.created_at}
        </span>
        <span className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {report.issue_count} 个问题
        </span>
      </div>

      <div className="flex gap-1.5">
        {report.high_count > 0 && (
          <span className="text-[9px] font-mono text-down border border-down/30 px-2 py-0.5 rounded-[3px]">
            高 {report.high_count}
          </span>
        )}
        {report.medium_count > 0 && (
          <span className="text-[9px] font-mono text-warn border border-warn/30 px-2 py-0.5 rounded-[3px]">
            中 {report.medium_count}
          </span>
        )}
        {report.low_count > 0 && (
          <span className="text-[9px] font-mono text-info border border-info/30 px-2 py-0.5 rounded-[3px]">
            低 {report.low_count}
          </span>
        )}
        {report.issue_count === 0 && (
          <span className="text-[9px] font-mono text-up border border-up/30 px-2 py-0.5 rounded-[3px]">
            正常
          </span>
        )}
      </div>
    </Link>
  );
}
