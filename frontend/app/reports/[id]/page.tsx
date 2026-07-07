"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Sparkles, Calendar, AlertCircle } from "lucide-react";
import IssueList from "@/components/IssueList";
import { getReport, generateReport } from "@/lib/api";
import type { ReportData } from "@/lib/types";

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const id = params.id as string;
        const data = await getReport(id);
        setReport(data);
      } catch {
        // ignore
      }
      setLoading(false);
    };
    load();
  }, [params]);

  const handleSendEmail = async () => {
    if (!report) return;
    setSendingEmail(true);
    setEmailMsg("");
    try {
      await generateReport({ useMock: false, sendEmail: true });
      setEmailMsg("邮件已发送至配置的邮箱地址");
    } catch {
      setEmailMsg("邮件发送失败，请检查 SMTP 配置");
    }
    setSendingEmail(false);
  };

  if (loading) {
    return (
      <div className="px-6 py-6">
        <div className="text-center py-20 text-fainter">加载中...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="px-6 py-6">
        <div className="bg-panel rounded-md border border-line p-12 text-center">
          <AlertCircle className="w-14 h-14 text-fainter mx-auto mb-4" />
          <h2 className="text-base font-semibold text-fg mb-2">报告不存在</h2>
          <button
            onClick={() => router.push("/reports")}
            className="text-info text-sm hover:underline"
          >
            返回报告列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/reports")}
            className="w-8 h-8 border border-line rounded-md flex items-center justify-center text-muted hover:text-fg hover:bg-panel-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-ink tracking-tight font-display">
              {report.summary.title || "运营晨报"}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-[11px] text-faint font-mono">
                <Calendar className="w-3 h-3" />
                {report.created_at}
              </span>
              {report.summary.ai_powered ? (
                <span className="flex items-center gap-1 text-[9px] font-mono text-ai border border-ai/30 px-1.5 py-0.5 rounded-[3px]">
                  <Sparkles className="w-2.5 h-2.5" />
                  AI 生成
                </span>
              ) : (
                <span className="text-[9px] font-mono text-muted border border-line px-1.5 py-0.5 rounded-[3px]">
                  模板生成
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleSendEmail}
          disabled={sendingEmail}
          className="flex items-center gap-2 bg-ink text-app px-4 py-2 rounded-md text-xs font-semibold hover:bg-white disabled:opacity-50"
        >
          <Mail className="w-4 h-4" />
          {sendingEmail ? "发送中..." : "发送邮件"}
        </button>
      </div>

      {emailMsg && (
        <div className="bg-info/10 border border-info/30 text-info rounded-md p-3 mb-6 text-sm">
          {emailMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-panel rounded-md border border-line p-4 text-center">
          <div className="text-2xl font-bold text-ink tabular font-display">{report.issue_count}</div>
          <div className="text-[10px] text-faint mt-1 font-mono">问题总数</div>
        </div>
        <div className="bg-panel rounded-md border border-line border-l-2 border-l-down p-4 text-center">
          <div className="text-2xl font-bold text-down tabular font-display">{report.high_count}</div>
          <div className="text-[10px] text-faint mt-1 font-mono">高优先级</div>
        </div>
        <div className="bg-panel rounded-md border border-line border-l-2 border-l-warn p-4 text-center">
          <div className="text-2xl font-bold text-warn tabular font-display">{report.medium_count}</div>
          <div className="text-[10px] text-faint mt-1 font-mono">中优先级</div>
        </div>
        <div className="bg-panel rounded-md border border-line border-l-2 border-l-info p-4 text-center">
          <div className="text-2xl font-bold text-info tabular font-display">{report.low_count}</div>
          <div className="text-[10px] text-faint mt-1 font-mono">低优先级</div>
        </div>
      </div>

      {/* Overview */}
      {report.summary.overview && (
        <div className="bg-panel rounded-md border border-line p-5 mb-4">
          <h2 className="text-[11px] font-semibold text-fg mb-3">晨报概览</h2>
          <div className="bg-inset border border-line-soft rounded-[5px] p-3.5 text-sm text-fg whitespace-pre-wrap leading-relaxed">
            {report.summary.overview}
          </div>
        </div>
      )}

      {/* Issues */}
      <div className="bg-panel rounded-md border border-line p-5">
        <h2 className="text-[11px] font-semibold text-fg mb-4">
          问题详情 ({report.issue_count})
        </h2>
        <IssueList issues={report.issues} />
      </div>
    </div>
  );
}
