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

export async function searchXHS(keyword: string, maxResults: number = 9999): Promise<{
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
  gateway_running: boolean;
  browser_search_running: boolean;
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

export async function getXHSHotSearch(): Promise<{
  success: boolean;
  total: number;
  hot_list: Array<{ title: string; score: string; search_id: string }>;
  error?: string;
}> {
  const res = await client.get("/api/xhs/hot-search");
  return res.data;
}

export async function getXHSSearchSuggest(keyword: string): Promise<{
  success: boolean;
  keyword: string;
  suggestions: string[];
  error?: string;
}> {
  const res = await client.get("/api/xhs/search-suggest", { params: { keyword } });
  return res.data;
}

// ---- 关键词趋势分析 ----

export interface KeywordSnapshot {
  timestamp: string;
  date: string;
  time: string;
  total_notes: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_collects: number;
  total_engagement: number;
  avg_engagement: number;
  video_count: number;
  image_count: number;
  gallery_count: number;
  unique_authors: number;
}

export interface KeywordTrendData {
  keyword: string;
  has_data: boolean;
  snapshot_count?: number;
  latest?: KeywordSnapshot;
  previous?: KeywordSnapshot | null;
  history?: KeywordSnapshot[];
  engagement_change?: number;
  engagement_change_pct?: number;
  notes_change?: number;
  likes_change?: number;
  comments_change?: number;
  authors_change?: number;
  trend?: "up" | "down" | "flat" | "new" | "unknown";
}

export async function getKeywordTrend(keyword: string): Promise<KeywordTrendData> {
  const res = await client.get("/api/xhs/keyword-trend", { params: { keyword } });
  return res.data;
}

export async function getKeywordSnapshots(): Promise<Record<string, {
  snapshot_count: number;
  latest_date: string;
  latest_time: string;
  total_notes: number;
  total_engagement: number;
}>> {
  const res = await client.get("/api/xhs/keyword-snapshots");
  return res.data;
}

// ---- 小红书实时 API (Gateway) ----

export async function getXHSUserPosted(
  userId: string,
  cursor: string = "",
  num: number = 30
): Promise<{
  success: boolean;
  user_id: string;
  total: number;
  has_more: boolean;
  cursor: string;
  notes: Array<{
    note_id: string;
    title: string;
    type: string;
    liked_count: string;
    author_nickname: string;
    cover_url: string;
    url: string;
  }>;
  error?: string;
}> {
  const res = await client.get("/api/xhs/user-posted", {
    params: { user_id: userId, cursor, num },
  });
  return res.data;
}

export async function getXHSUserInfo(userId: string): Promise<{
  success: boolean;
  user_id: string;
  nickname: string;
  desc: string;
  avatar: string;
  fans: string;
  follows: string;
  interaction: string;
  tags: string[];
  error?: string;
}> {
  const res = await client.get("/api/xhs/user-info", {
    params: { user_id: userId },
  });
  return res.data;
}

export async function getXHSNoteFeed(noteId: string, xsecToken: string = ""): Promise<{
  success: boolean;
  note: {
    note_id: string;
    title: string;
    desc: string;
    type: string;
    liked_count: string;
    collected_count: string;
    comment_count: string;
    shared_count: string;
    author_nickname: string;
    author_id: string;
    images: string[];
    time: string;
    ip_location: string;
    tag_list: string[];
  } | null;
  error?: string;
}> {
  const res = await client.get("/api/xhs/note-feed", {
    params: { note_id: noteId, xsec_token: xsecToken },
  });
  return res.data;
}
