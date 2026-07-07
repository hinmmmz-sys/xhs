"use client";

import { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import ReportCard from "@/components/ReportCard";
import { getReports } from "@/lib/api";
import type { ReportListItem } from "@/lib/types";

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getReports();
        setReports(data);
      } catch {
        // ignore
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-ink tracking-tight font-display">
          报告历史 <span className="text-fainter font-normal text-sm">Reports</span>
        </h1>
        <p className="text-[11px] text-faint mt-1 font-mono">查看所有历史运营晨报</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-fainter">加载中...</div>
      ) : reports.length === 0 ? (
        <div className="bg-panel rounded-md border border-line p-12 text-center">
          <FileText className="w-14 h-14 text-fainter mx-auto mb-4" />
          <h2 className="text-base font-semibold text-fg mb-2">暂无报告</h2>
          <p className="text-sm text-fainter">生成第一份运营晨报后将会显示在这里</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
