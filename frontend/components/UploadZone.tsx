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
  const [results, setResults] = useState<
    Array<{ filename: string; status: string; file_type?: string; rows?: number; reason?: string }>
  >([]);
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
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-[1.5px] border-dashed rounded-lg p-12 text-center cursor-pointer bg-inset ${
          dragging ? "border-ink bg-panel-2" : "border-[#33363d] hover:border-[#454951]"
        }`}
      >
        <div className="w-11 h-11 mx-auto mb-3 border border-[#33363d] rounded-lg flex items-center justify-center">
          <UploadCloud className="w-5 h-5 text-faint" />
        </div>
        <p className="text-fg font-medium text-sm">拖拽 CSV 文件到此处，或点击选择</p>
        <p className="text-[11px] text-fainter mt-1.5 font-mono">
          支持 广告报告 · 库存报告 · 评论报告 · 销量报告
        </p>
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
          <p className="text-sm font-medium text-fg">已选择 {selectedFiles.length} 个文件</p>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-panel border border-line rounded-md p-3"
            >
              <FileIcon className="w-5 h-5 text-fainter" />
              <span className="text-sm text-fg flex-1 truncate font-mono">{file.name}</span>
              <span className="text-[10px] text-fainter font-mono">
                {(file.size / 1024).toFixed(1)} KB
              </span>
              <button
                onClick={() => removeFile(index)}
                className="text-fainter hover:text-down"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-ink text-app py-2.5 rounded-md font-semibold text-sm hover:bg-white disabled:opacity-50"
          >
            {uploading ? "上传中..." : "上传文件"}
          </button>
        </div>
      )}

      {/* Upload results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-fg">上传结果</p>
          {results.map((result, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 border rounded-md p-3 ${
                result.status === "ok"
                  ? "bg-up/5 border-up/30"
                  : "bg-down/5 border-down/30"
              }`}
            >
              {result.status === "ok" ? (
                <CheckCircle className="w-5 h-5 text-up" />
              ) : (
                <AlertCircle className="w-5 h-5 text-down" />
              )}
              <span className="text-sm text-fg flex-1 font-mono">{result.filename}</span>
              {result.file_type && (
                <span className="text-[10px] bg-panel border border-line px-2 py-0.5 rounded text-muted font-mono">
                  {FILE_TYPE_LABELS[result.file_type] || result.file_type}
                </span>
              )}
              {result.rows !== undefined && (
                <span className="text-[10px] text-fainter font-mono">{result.rows} 行</span>
              )}
              {result.reason && (
                <span className="text-[10px] text-down font-mono">{result.reason}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
