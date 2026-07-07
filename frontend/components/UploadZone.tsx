"use client";

import { useState, useRef, useCallback } from "react";
import { UploadCloud, File as FileIcon, X, CheckCircle, AlertCircle } from "lucide-react";

interface UploadZoneProps {
  onUpload: (files: File[]) => Promise<void>;
  disabled?: boolean;
}

const FILE_TYPE_LABELS: Record<string, string> = {
  advertising: "广告报告",
  inventory: "库存报告",
  review: "评论报告",
  sales: "销量报告",
};

export default function UploadZone({ onUpload, disabled }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<Array<{ filename: string; status: string; file_type?: string; rows?: number; reason?: string }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith(".csv"));
    setSelectedFiles((prev) => [...prev, ...files]);
  }, []);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    try {
      // 调用父组件的上传函数
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("files", file);
        const res = await fetch("http://localhost:8000/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.results) {
          setResults((prev) => [...prev, ...data.results]);
        }
      }
      setSelectedFiles([]);
      if (onUpload) await onUpload([]);
    } catch (err) {
      console.error("上传失败:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <UploadCloud className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">拖拽 CSV 文件到此处，或点击选择</p>
        <p className="text-xs text-gray-400 mt-1">支持广告报告、库存报告、评论报告、销量报告</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".csv"
          onChange={handleSelect}
          className="hidden"
        />
      </div>

      {/* Selected files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">已选择 {selectedFiles.length} 个文件</p>
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-3">
              <FileIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-700 flex-1 truncate">{file.name}</span>
              <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</span>
              <button
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? "上传中..." : "上传文件"}
          </button>
        </div>
      )}

      {/* Upload results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">上传结果</p>
          {results.map((result, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 border rounded-lg p-3 ${
                result.status === "ok" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              }`}
            >
              {result.status === "ok" ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="text-sm text-gray-700 flex-1">{result.filename}</span>
              {result.file_type && (
                <span className="text-xs bg-white px-2 py-0.5 rounded text-gray-600">
                  {FILE_TYPE_LABELS[result.file_type] || result.file_type}
                </span>
              )}
              {result.rows !== undefined && (
                <span className="text-xs text-gray-400">{result.rows} 行</span>
              )}
              {result.reason && (
                <span className="text-xs text-red-500">{result.reason}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
