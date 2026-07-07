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
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">上传数据</h1>
          <p className="text-sm text-gray-500 mt-1">上传 CSV 数据文件，或使用模拟数据快速体验</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleGenerateMock}
            className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-cyan-700 transition-colors"
          >
            <Database className="w-4 h-4" />
            生成模拟数据
          </button>
          {files.some((f) => f.source === "upload") && (
            <button
              onClick={handleClear}
              className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-lg font-medium hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              清空上传
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-3 mb-6 text-sm">
          {message}
        </div>
      )}

      {/* Upload zone */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">上传 CSV 文件</h2>
        <UploadZone onUpload={loadFiles} />
      </div>

      {/* File list */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">数据文件列表</h2>
        {loading ? (
          <p className="text-gray-400 text-sm">加载中...</p>
        ) : files.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">暂无数据文件</p>
        ) : (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-100"
              >
                <FileSpreadsheet className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-700 flex-1">{file.filename}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  file.source === "mock" ? "bg-cyan-100 text-cyan-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {file.source === "mock" ? "模拟" : "上传"}
                </span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {FILE_TYPE_LABELS[file.file_type] || file.file_type}
                </span>
                <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</span>
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
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-600 disabled:opacity-50 transition-all"
        >
          <Sparkles className="w-5 h-5" />
          {generating ? "正在生成晨报..." : "生成运营晨报"}
        </button>
      )}
    </div>
  );
}
