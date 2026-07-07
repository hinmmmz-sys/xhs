"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Flame,
  ChevronRight,
  RefreshCw,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Video,
  Image,
  Images,
  TrendingUp,
  AlertTriangle,
  Download,
  Search,
  ExternalLink,
  X,
} from "lucide-react";
import { getXHSStats, getXHSNotes, syncXHS, searchXHS } from "@/lib/api";
import type { XHSStats, XHSNoteRecord } from "@/lib/types";
import XHSOverviewCard from "@/components/XHSOverviewCard";
import XHSTopNotesTable from "@/components/XHSTopNotesTable";

function formatNum(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  return value.toLocaleString("zh-CN");
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  "视频": { icon: Video, color: "text-blue-500", bg: "bg-blue-50" },
  "图文": { icon: Image, color: "text-green-500", bg: "bg-green-50" },
  "图集": { icon: Images, color: "text-purple-500", bg: "bg-purple-50" },
};

export default function XHSPage() {
  const [stats, setStats] = useState<XHSStats | null>(null);
  const [notes, setNotes] = useState<XHSNoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [sortBy, setSortBy] = useState("engagement");
  
  // 搜索相关状态
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{
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
  }>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const loadData = useCallback(async (sort: string) => {
    setLoading(true);
    try {
      const [statsData, notesData] = await Promise.all([
        getXHSStats(),
        getXHSNotes(100, sort),
      ]);
      setStats(statsData);
      setNotes(notesData.notes);
    } catch (err) {
      console.error("获取小红书数据失败:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData(sortBy);
  }, [sortBy, loadData]);

  const handleSearch = async () => {
    if (!searchKeyword.trim()) return;
    
    setSearching(true);
    setShowSearchResults(true);
    try {
      const result = await searchXHS(searchKeyword, 20);
      setSearchResults(result.notes);
    } catch (err) {
      console.error("搜索失败:", err);
      setSearchResults([]);
    }
    setSearching(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncXHS();
      await loadData(sortBy);
    } catch (err) {
      console.error("同步失败:", err);
    }
    setSyncing(false);
  };

  // 内容类型分布
  const typeDistribution = stats
    ? [
        { name: "视频", value: stats.video_count, color: "#3b82f6" },
        { name: "图文", value: stats.image_count, color: "#10b981" },
        { name: "图集", value: stats.gallery_count, color: "#8b5cf6" },
      ].filter((t) => t.value > 0)
    : [];

  const totalNotes = typeDistribution.reduce((sum, t) => sum + t.value, 0);

  return (
    <div className="px-6 py-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">XHS Insights</span>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-xs text-slate-600 font-medium">小红书种草分析</span>
          {stats && (
            <span className="ml-2 text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {stats.total_notes} 篇作品
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-[11px] border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-50 shadow-sm cursor-pointer"
          >
            <option value="engagement">按互动量</option>
            <option value="liked">按点赞数</option>
            <option value="time">按发布时间</option>
          </select>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[11px] font-medium hover:bg-blue-700 disabled:opacity-50 shadow-sm"
          >
            {syncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            {syncing ? "同步中" : "同步数据"}
          </button>
          <button
            onClick={() => loadData(sortBy)}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 border border-slate-200 bg-white shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">
          <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-slate-300" />
          <span className="text-xs">加载小红书数据...</span>
        </div>
      ) : !stats ? (
        <div className="bg-white rounded-lg border border-slate-200/70 p-8 text-center text-slate-400">
          暂无数据，请先在 XHS-Downloader 中采集作品
        </div>
      ) : (
        <div className="space-y-4">
          {/* ===== 搜索栏 ===== */}
          <div className="bg-white rounded-lg border border-slate-200/70 p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchKeyword.trim()) {
                      handleSearch();
                    }
                  }}
                  placeholder="搜索小红书帖子...例如：外劳招聘、香港工作、澳洲打工"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searching || !searchKeyword.trim()}
                className="flex items-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {searching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    搜索中...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    搜索
                  </>
                )}
              </button>
              {showSearchResults && (
                <button
                  onClick={() => {
                    setShowSearchResults(false);
                    setSearchResults([]);
                    setSearchKeyword("");
                  }}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {showSearchResults && searchResults.length > 0 && (
              <div className="mt-3 text-xs text-slate-500">
                找到 <span className="font-semibold text-slate-700">{searchResults.length}</span> 条相关结果
              </div>
            )}
          </div>

          {/* ===== 搜索结果 ===== */}
          {showSearchResults && (
            <div className="bg-white rounded-lg border border-slate-200/70 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-red-500" />
                  <h4 className="text-sm font-semibold text-slate-700">搜索结果</h4>
                  <span className="text-xs text-slate-400">“{searchKeyword}”</span>
                </div>
              </div>
              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  未找到相关帖子，请尝试其他关键词
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((result, idx) => (
                    <a
                      key={result.id || idx}
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-4 border border-slate-200 rounded-lg hover:border-red-300 hover:bg-red-50/30 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-medium text-slate-700 group-hover:text-red-600 line-clamp-2">
                            {result.title || "无标题"}
                          </h5>
                          {result.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {result.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                            <span>{result.author}</span>
                            <span>{result.publish_time}</span>
                            {result.tags && (
                              <span className="text-slate-300">{result.tags}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-3 text-xs">
                          <div className="text-center">
                            <Heart className="w-3.5 h-3.5 text-red-400 mx-auto" />
                            <span className="text-slate-600 font-medium">{result.likes}</span>
                          </div>
                          <div className="text-center">
                            <MessageCircle className="w-3.5 h-3.5 text-blue-400 mx-auto" />
                            <span className="text-slate-600 font-medium">{result.comments}</span>
                          </div>
                          <div className="text-center">
                            <Bookmark className="w-3.5 h-3.5 text-yellow-400 mx-auto" />
                            <span className="text-slate-600 font-medium">{result.favorites}</span>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-red-400" />
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* ===== 概览统计 ===== */}
          <XHSOverviewCard stats={stats} />

          {/* ===== 类型分布 + 作者排行 ===== */}
          <div className="grid grid-cols-3 gap-3">
            {/* 内容类型分布 */}
            <div className="bg-white rounded-lg border border-slate-200/70 p-4">
              <h4 className="text-[11px] font-semibold text-slate-600 mb-3">内容类型分布</h4>
              <div className="space-y-2.5">
                {typeDistribution.map((type) => {
                  const pct = totalNotes > 0 ? (type.value / totalNotes) * 100 : 0;
                  const config = TYPE_CONFIG[type.name];
                  return (
                    <div key={type.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          {config && <config.icon className={`w-3 h-3 ${config.color}`} />}
                          <span className="text-[11px] text-slate-500">{type.name}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-700">
                          {type.value} <span className="text-slate-400 font-normal">({pct.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: type.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* 环形图示意 */}
              <div className="mt-4 flex items-center justify-center">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                    {(() => {
                      let offset = 0;
                      return typeDistribution.map((type) => {
                        const pct = totalNotes > 0 ? type.value / totalNotes : 0;
                        const dash = pct * 251.2; // 2*PI*40
                        const circle = (
                          <circle
                            key={type.name}
                            cx="50" cy="50" r="40"
                            fill="none"
                            stroke={type.color}
                            strokeWidth="12"
                            strokeDasharray={`${dash} 251.2`}
                            strokeDashoffset={-offset}
                          />
                        );
                        offset += dash;
                        return circle;
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-slate-700">{totalNotes}</span>
                    <span className="text-[9px] text-slate-400">总作品</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 作者排行榜 */}
            <div className="col-span-2 bg-white rounded-lg border border-slate-200/70 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[11px] font-semibold text-slate-600">作者排行榜</h4>
                <span className="text-[10px] text-slate-400">按互动量排序</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] text-slate-400 border-b border-slate-100">
                      <th className="text-left font-medium py-1.5 px-2">#</th>
                      <th className="text-left font-medium py-1.5 px-2">作者</th>
                      <th className="text-center font-medium py-1.5 px-2">作品数</th>
                      <th className="text-right font-medium py-1.5 px-2">总互动</th>
                      <th className="text-right font-medium py-1.5 px-2">篇均互动</th>
                      <th className="text-left font-medium py-1.5 px-2 w-32">互动占比</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.top_authors.map((author, idx) => {
                      const avgEng = author.notes > 0 ? Math.round(author.engagement / author.notes) : 0;
                      const sharePct = stats.total_engagement > 0 ? (author.engagement / stats.total_engagement) * 100 : 0;
                      const isTop = idx < 3;
                      return (
                        <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="py-2 px-2">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                              isTop ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"
                            }`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-[11px] font-medium text-slate-700">{author.name}</td>
                          <td className="text-center py-2 px-2 text-[11px] text-slate-500">{author.notes}</td>
                          <td className="text-right py-2 px-2 text-[11px] font-semibold text-slate-700">{formatNum(author.engagement)}</td>
                          <td className="text-right py-2 px-2 text-[11px] text-slate-500">{formatNum(avgEng)}</td>
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-400 rounded-full" style={{ width: `${sharePct}%` }} />
                              </div>
                              <span className="text-[10px] text-slate-400 w-8 text-right">{sharePct.toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ===== 全量笔记表 ===== */}
          <div className="bg-white rounded-lg border border-slate-200/70 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-red-500" />
                <h4 className="text-[11px] font-semibold text-slate-600">全部作品</h4>
                <span className="text-[10px] text-slate-400">· {notes.length} 篇</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] text-slate-400 border-b border-slate-100">
                    <th className="text-left font-medium py-2 px-2">#</th>
                    <th className="text-left font-medium py-2 px-2">标题</th>
                    <th className="text-left font-medium py-2 px-2">作者</th>
                    <th className="text-center font-medium py-2 px-2">类型</th>
                    <th className="text-right font-medium py-2 px-2"><Heart className="w-3 h-3 inline" /></th>
                    <th className="text-right font-medium py-2 px-2"><MessageCircle className="w-3 h-3 inline" /></th>
                    <th className="text-right font-medium py-2 px-2"><Share2 className="w-3 h-3 inline" /></th>
                    <th className="text-right font-medium py-2 px-2"><Bookmark className="w-3 h-3 inline" /></th>
                    <th className="text-right font-medium py-2 px-2">互动量</th>
                    <th className="text-right font-medium py-2 px-2">发布时间</th>
                  </tr>
                </thead>
                <tbody>
                  {notes.map((note, idx) => {
                    const engagement = note.liked_count + note.comment_count + note.share_count + note.collect_count;
                    const TypeIcon = TYPE_CONFIG[note.note_type]?.icon || Image;
                    const isHot = idx < 3;
                    return (
                      <tr key={note.note_id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="py-2 px-2">
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                            isHot ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-2 px-2 max-w-[200px]">
                          <a
                            href={note.note_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-medium text-slate-700 hover:text-blue-600 hover:underline truncate block"
                          >
                            {note.title || "无标题"}
                          </a>
                          {note.tags && (
                            <div className="text-[10px] text-slate-400 mt-0.5 truncate">{note.tags}</div>
                          )}
                        </td>
                        <td className="py-2 px-2 text-[11px] text-slate-500 whitespace-nowrap">{note.author_nickname}</td>
                        <td className="text-center py-2 px-2">
                          <TypeIcon className="w-3 h-3 text-slate-400 inline" />
                        </td>
                        <td className="text-right py-2 px-2 text-[11px] text-slate-600">{formatNum(note.liked_count)}</td>
                        <td className="text-right py-2 px-2 text-[11px] text-slate-600">{formatNum(note.comment_count)}</td>
                        <td className="text-right py-2 px-2 text-[11px] text-slate-600">{formatNum(note.share_count)}</td>
                        <td className="text-right py-2 px-2 text-[11px] text-slate-600">{formatNum(note.collect_count)}</td>
                        <td className={`text-right py-2 px-2 text-[11px] font-semibold ${isHot ? "text-red-600" : "text-slate-700"}`}>
                          {formatNum(engagement)}
                        </td>
                        <td className="text-right py-2 px-2 text-[10px] text-slate-400 whitespace-nowrap">{note.publish_time}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ===== 低互动预警 ===== */}
          {stats.low_engagement_notes.length > 0 && (
            <div className="bg-amber-50/40 rounded-lg border border-amber-100 p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">低互动预警</span>
                <span className="text-[10px] text-amber-600">互动量 &lt; 50 的作品</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {stats.low_engagement_notes.map((note) => {
                  const engagement = note.liked_count + note.comment_count + note.share_count + note.collect_count;
                  return (
                    <div key={note.note_id} className="flex items-center gap-2 bg-white/60 rounded-md p-2 border border-amber-50">
                      <div className="flex-1 min-w-0">
                        <a
                          href={note.note_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-medium text-slate-600 hover:text-blue-600 truncate block"
                        >
                          {note.title || "无标题"}
                        </a>
                        <div className="text-[10px] text-slate-400">{note.author_nickname}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-[11px] font-bold text-amber-600">{engagement}</div>
                        <div className="text-[9px] text-slate-400">互动</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
