"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, Trash2, FileSpreadsheet, Database } from "lucide-react";
import UploadZone from "@/components/UploadZone";
import { listFiles, generateMockData, generateReport, clearUploads } from "@/lib/api";
import type { UploadedFile } from "@/lib/types";
import { useRouter } from "next/navigation";

const FILE_TYPE_LABELS: Record<string, string> = {
  advertising: "广告报告",
  inventory: "库存报告",
  review: "评论报告",
  sales: "销量报告",
  unknown: "未知",
};

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listFiles();
      setFiles(data);
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleGenerateMock = async () => {
    try {
      await generateMockData();
      setMessage("模拟数据已生成");
      await loadFiles();
    } catch {
      setMessage("生成模拟数据失败");
    }
  };

  const handleClear = async () => {
    try {
      await clearUploads();
      setMessage("已清空上传文件");
      await loadFiles();
    } catch {
      setMessage("清空失败");
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    setMessage("");
    try {
      await generateReport({ useMock: false, sendEmail: false });
      router.push("/");
    } catch {
      setMessage("生成报告失败，请确保已上传数据文件");
    }
    setGenerating(false);
  };

  return (
    <div className="px-6 py-6">
      <div className="flex items-end justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-ink tracking-tight font-display">
            上传数据 <span className="text-fainter font-normal text-sm">Data Import</span>
          </h1>
          <p className="text-[11px] text-faint mt-1 font-mono">
            上传 CSV 数据文件，或使用模拟数据快速体验
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateMock}
            className="flex items-center gap-2 border border-line text-fg px-3.5 py-2 rounded-md text-xs font-medium hover:bg-panel-2"
          >
            <Database className="w-4 h-4" />
            生成模拟数据
          </button>
          {files.some((f) => f.source === "upload") && (
            <button
              onClick={handleClear}
              className="flex items-center gap-2 border border-down/30 text-down px-3.5 py-2 rounded-md text-xs font-medium hover:bg-down/10"
            >
              <Trash2 className="w-4 h-4" />
              清空上传
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="bg-info/10 border border-info/30 text-info rounded-md p-3 mb-6 text-sm">
          {message}
        </div>
      )}

      {/* Upload zone */}
      <div className="bg-panel rounded-md border border-line p-6 mb-4">
        <h2 className="text-[11px] font-semibold text-fg mb-4">上传 CSV 文件</h2>
        <UploadZone onUpload={loadFiles} />
      </div>

      {/* File list */}
      <div className="bg-panel rounded-md border border-line overflow-hidden mb-4">
        <div className="flex items-center px-4 py-3 border-b border-line">
          <h2 className="text-[11px] font-semibold text-fg">数据文件列表</h2>
          <span className="ml-auto text-[10px] text-fainter font-mono">
            {files.length} files
          </span>
        </div>
        {loading ? (
          <p className="text-fainter text-sm p-4">加载中...</p>
        ) : files.length === 0 ? (
          <p className="text-fainter text-sm py-8 text-center">暂无数据文件</p>
        ) : (
          <div>
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 px-4 py-3 border-b border-line-soft last:border-0"
              >
                <FileSpreadsheet className="w-4 h-4 text-up flex-shrink-0" />
                <span className="text-sm text-fg-strong flex-1 font-mono">{file.filename}</span>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-[3px] border ${
                    file.source === "mock"
                      ? "text-info border-info/30"
                      : "text-fg border-line"
                  }`}
                >
                  {file.source === "mock" ? "模拟" : "上传"}
                </span>
                <span className="text-[9px] font-mono text-muted border border-line px-2 py-0.5 rounded-[3px]">
                  {FILE_TYPE_LABELS[file.file_type] || file.file_type}
                </span>
                <span className="text-[10px] text-fainter font-mono w-16 text-right">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate button */}
      {files.length > 0 && (
        <button
          onClick={handleGenerateReport}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 bg-ink text-app py-3 rounded-md font-semibold text-sm hover:bg-white disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          {generating ? "正在生成晨报..." : "生成运营晨报"}
        </button>
      )}
    </div>
  );
}
