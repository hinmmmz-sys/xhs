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
      // 重新生成并发送邮件
      await generateReport({ useMock: false, sendEmail: true });
      setEmailMsg("邮件已发送至配置的邮箱地址");
    } catch {
      setEmailMsg("邮件发送失败，请检查 SMTP 配置");
    }
    setSendingEmail(false);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-20 text-gray-400">加载中...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-600 mb-2">报告不存在</h2>
          <button
            onClick={() => router.push("/reports")}
            className="text-blue-600 text-sm hover:underline"
          >
            返回报告列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/reports")}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {report.summary.title || "运营晨报"}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <Calendar className="w-3.5 h-3.5" />
                {report.created_at}
              </span>
              {report.summary.ai_powered ? (
                <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                  <Sparkles className="w-3 h-3" />
                  AI 生成
                </span>
              ) : (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  模板生成
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleSendEmail}
          disabled={sendingEmail}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Mail className="w-4 h-4" />
          {sendingEmail ? "发送中..." : "发送邮件"}
        </button>
      </div>

      {emailMsg && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-3 mb-6 text-sm">
          {emailMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5 text-center">
          <div className="text-3xl font-bold text-gray-800">{report.issue_count}</div>
          <div className="text-xs text-gray-500 mt-1">问题总数</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 text-center border-l-4 border-red-500">
          <div className="text-3xl font-bold text-red-600">{report.high_count}</div>
          <div className="text-xs text-gray-500 mt-1">高优先级</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 text-center border-l-4 border-amber-500">
          <div className="text-3xl font-bold text-amber-600">{report.medium_count}</div>
          <div className="text-xs text-gray-500 mt-1">中优先级</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 text-center border-l-4 border-blue-500">
          <div className="text-3xl font-bold text-blue-600">{report.low_count}</div>
          <div className="text-xs text-gray-500 mt-1">低优先级</div>
        </div>
      </div>

      {/* Overview */}
      {report.summary.overview && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 mb-6 border border-blue-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">晨报概览</h2>
          <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {report.summary.overview}
          </div>
        </div>
      )}

      {/* Issues */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          问题详情 ({report.issue_count})
        </h2>
        <IssueList issues={report.issues} />
      </div>
    </div>
  );
}
