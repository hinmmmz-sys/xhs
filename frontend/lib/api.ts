// API 请求封装

import axios from "axios";
import type {
  BusinessOverview,
  DateRangeOption,
  ReportData,
  ReportListItem,
  SettingsResponse,
  SettingsUpdate,
  UploadedFile,
  XHSNoteRecord,
  XHSStats,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

const client = axios.create({
  baseURL: API_BASE,
  timeout: 60000, // 60s — AI 总结可能较慢
});

// ---- 报告 ----

export async function generateReport(params: {
  useMock?: boolean;
  sendEmail?: boolean;
}): Promise<ReportData> {
  const res = await client.post("/api/reports/generate", {
    use_mock: params.useMock ?? false,
    send_email: params.sendEmail ?? false,
  });
  return res.data;
}

export async function getReports(): Promise<ReportListItem[]> {
  const res = await client.get("/api/reports");
  return res.data.reports;
}

export async function getLatestReport(): Promise<ReportData | null> {
  try {
    const res = await client.get("/api/reports/latest");
    return res.data;
  } catch {
    return null;
  }
}

export async function getReport(id: string): Promise<ReportData> {
  const res = await client.get(`/api/reports/${id}`);
  return res.data;
}

// ---- 上传 ----

export async function uploadFiles(files: File[]): Promise<{
  message: string;
  results: Array<{ filename: string; status: string; file_type?: string; rows?: number; reason?: string }>;
}> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const res = await client.post("/api/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function generateMockData(): Promise<{ message: string; files: string[] }> {
  const res = await client.post("/api/upload/generate-mock");
  return res.data;
}

export async function listFiles(): Promise<UploadedFile[]> {
  const res = await client.get("/api/upload/files");
  return res.data.files;
}

export async function clearUploads(): Promise<{ message: string }> {
  const res = await client.delete("/api/upload/clear");
  return res.data;
}

// ---- 设置 ----

export async function getSettings(): Promise<SettingsResponse> {
  const res = await client.get("/api/settings");
  return res.data;
}

export async function updateSettings(settings: SettingsUpdate): Promise<{
  message: string;
  updated_fields: string[];
  has_minimax: boolean;
  has_smtp: boolean;
}> {
  const res = await client.put("/api/settings", settings);
  return res.data;
}

// ---- 经营概览 ----

export async function getBusinessOverview(dateRange: string = "7d"): Promise<BusinessOverview> {
  const res = await client.get("/api/overview/", { params: { date_range: dateRange } });
  return res.data;
}

export async function getDateRanges(): Promise<DateRangeOption[]> {
  const res = await client.get("/api/overview/date-ranges");
  return res.data.ranges;
}

// ---- 小红书 (XHS) ----

export async function getXHSStats(): Promise<XHSStats> {
  const res = await client.get("/api/xhs/stats");
  return res.data;
}

export async function getXHSNotes(limit: number = 100, sortBy: string = "engagement"): Promise<{ total: number; notes: XHSNoteRecord[] }> {
  const res = await client.get("/api/xhs/notes", { params: { limit, sort_by: sortBy } });
  return res.data;
}

export async function syncXHS(): Promise<{ message: string; total_notes: number }> {
  const res = await client.get("/api/xhs/sync");
  return res.data;
}

export async function searchXHS(keyword: string, maxResults: number = 20): Promise<{
  keyword: string;
  total: number;
  notes: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    author: string;
    author_id: string;
    likes: string;
    comments: string;
    favorites: string;
    shares: string;
    publish_time: string;
    url: string;
    tags: string;
    source?: string;
  }>;
}> {
  const res = await client.post("/api/xhs/search", {
    keyword,
    max_results: maxResults,
  });
  return res.data;
}

export async function getXHSSearchEngine(): Promise<{
  total_notes: number;
  sources: Record<string, number>;
  xhs_api_running: boolean;
}> {
  const res = await client.get("/api/xhs/search-engine");
  return res.data;
}

export async function searchXHSUserProfile(url: string): Promise<{
  url: string;
  total: number;
  notes: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    author: string;
    likes: string;
    comments: string;
    favorites: string;
    shares: string;
    publish_time: string;
    url: string;
    tags: string;
  }>;
}> {
  const res = await client.post("/api/xhs/user-profile", { url });
  return res.data;
}

export async function getXHSNoteDetail(url: string): Promise<{
  success: boolean;
  data: {
    id: string;
    title: string;
    description: string;
    type: string;
    author: string;
    author_id: string;
    likes: string;
    comments: string;
    favorites: string;
    shares: string;
    publish_time: string;
    url: string;
    tags: string;
  } | null;
  message?: string;
}> {
  const res = await client.post("/api/xhs/note-detail", { url });
  return res.data;
}
