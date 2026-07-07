"use client";

import { ISSUE_TYPE_LABELS, SEVERITY_CONFIG, type Issue } from "@/lib/types";

export default function IssueList({ issues }: { issues: Issue[] }) {
  if (issues.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">今日未检测到异常问题</p>
        <p className="text-sm mt-2">各项指标正常，继续保持运营节奏</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {issues.map((issue, index) => {
        const sev = SEVERITY_CONFIG[issue.severity];
        const typeLabel = ISSUE_TYPE_LABELS[issue.type];
        return (
          <div
            key={index}
            className={`border-l-4 ${sev.border} ${sev.bg} rounded-r-lg p-4`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-semibold ${sev.color} bg-white px-2 py-1 rounded`}>
                {sev.label}
              </span>
              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                {typeLabel}
              </span>
              <span className="text-xs text-gray-400 ml-auto">
                {issue.sku || issue.target}
              </span>
            </div>
            <p className="text-sm text-gray-800 mb-2">
              {index + 1}. {issue.description}
            </p>
            <div className="flex items-start gap-2">
              <span className="text-green-600 text-sm font-medium flex-shrink-0">→</span>
              <p className="text-sm text-green-700">{issue.recommended_action}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
