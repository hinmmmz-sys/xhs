"use client";

import { ISSUE_TYPE_LABELS, type Issue, type Severity } from "@/lib/types";

// 深色终端下的严重度配色（覆盖 types.ts 中的浅色 SEVERITY_CONFIG）
const SEV: Record<Severity, { label: string; accent: string; text: string }> = {
  high: { label: "高优先级", accent: "border-l-down", text: "text-down" },
  medium: { label: "中优先级", accent: "border-l-warn", text: "text-warn" },
  low: { label: "低优先级", accent: "border-l-info", text: "text-info" },
};

export default function IssueList({ issues }: { issues: Issue[] }) {
  if (issues.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <p className="text-base text-fg">今日未检测到异常问题</p>
        <p className="text-sm mt-2 text-faint">各项指标正常，继续保持运营节奏</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {issues.map((issue, index) => {
        const sev = SEV[issue.severity];
        const typeLabel = ISSUE_TYPE_LABELS[issue.type];
        return (
          <div
            key={index}
            className={`border border-line ${sev.accent} border-l-2 rounded-[4px] bg-inset p-3.5`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[9px] font-mono ${sev.text}`}>{sev.label}</span>
              <span className="text-[9px] font-mono text-muted border border-line px-1.5 py-0.5 rounded-[3px]">
                {typeLabel}
              </span>
              <span className="text-[10px] text-fainter ml-auto font-mono">
                {issue.sku || issue.target}
              </span>
            </div>
            <p className="text-xs text-fg-strong mb-2">
              {index + 1}. {issue.description}
            </p>
            <div className="flex items-start gap-2">
              <span className="text-up text-xs font-medium flex-shrink-0">→</span>
              <p className="text-xs text-up/90">{issue.recommended_action}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
