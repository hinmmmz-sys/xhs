"use client";

import Link from "next/link";
import { FileText, AlertCircle, Clock } from "lucide-react";
import type { ReportListItem } from "@/lib/types";

export default function ReportCard({ report }: { report: ReportListItem }) {
  return (
    <Link
      href={`/reports/${report.id}`}
      className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-5 border border-gray-100"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-800">{report.title}</h3>
        </div>
        {report.ai_powered && (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">AI</span>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {report.created_at}
        </span>
        <span className="flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {report.issue_count} 个问题
        </span>
      </div>

      <div className="flex gap-2">
        {report.high_count > 0 && (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
            高 {report.high_count}
          </span>
        )}
        {report.medium_count > 0 && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
            中 {report.medium_count}
          </span>
        )}
        {report.low_count > 0 && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            低 {report.low_count}
          </span>
        )}
        {report.issue_count === 0 && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
            正常
          </span>
        )}
      </div>
    </Link>
  );
}
