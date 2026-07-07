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
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">报告历史</h1>
        <p className="text-sm text-gray-500 mt-1">查看所有历史运营晨报</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-600 mb-2">暂无报告</h2>
          <p className="text-sm text-gray-400">生成第一份运营晨报后将会显示在这里</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
