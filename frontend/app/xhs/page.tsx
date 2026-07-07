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
  AlertTriangle,
  Download,
  Search,
  ExternalLink,
  X,
} from "lucide-react";
import { getXHSStats, getXHSNotes, syncXHS, searchXHS } from "@/lib/api";
import type { XHSStats, XHSNoteRecord } from "@/lib/types";
import XHSOverviewCard from "@/components/XHSOverviewCard";

function formatNum(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  return value.toLocaleString("zh-CN");
}

// 深色终端：类型用灰阶区分
const TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
  视频: { icon: Video, color: "#e6e7ea" },
  图文: { icon: Image, color: "#9a9da4" },
  图集: { icon: Images, color: "#54575e" },
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
  const [searchResults, setSearchResults] = useState<
    Array<{
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
    }>
  >([]);
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
        { name: "视频", value: stats.video_count, color: TYPE_CONFIG["视频"].color },
        { name: "图文", value: stats.image_count, color: TYPE_CONFIG["图文"].color },
        { name: "图集", value: stats.gallery_count, color: TYPE_CONFIG["图集"].color },
      ].filter((t) => t.value > 0)
    : [];

  const totalNotes = typeDistribution.reduce((sum, t) => sum + t.value, 0);

  return (
    <div className="px-6 py-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-faint font-medium">XHS Insights</span>
          <ChevronRight className="w-3 h-3 text-fainter" />
          <span className="text-xs text-fg font-medium">小红书种草分析</span>
          {stats && (
            <span className="ml-2 text-[10px] text-muted bg-panel border border-line px-2 py-0.5 rounded-full font-mono">
              {stats.total_notes} 篇作品
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-[11px] border border-line rounded-md px-2.5 py-1.5 bg-panel text-fg focus:outline-none focus:border-[#33363d] cursor-pointer"
          >
            <option value="engagement">按互动量</option>
            <option value="liked">按点赞数</option>
            <option value="time">按发布时间</option>
          </select>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 bg-ink text-app px-3 py-1.5 rounded-md text-[11px] font-semibold hover:bg-white disabled:opacity-50"
          >
            {syncing ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Download className="w-3 h-3" />
            )}
            {syncing ? "同步中" : "同步数据"}
          </button>
          <button
            onClick={() => loadData(sortBy)}
            className="text-faint hover:text-fg p-1.5 rounded-md hover:bg-panel-2 border border-line bg-panel"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-fainter">
          <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-fainter" />
          <span className="text-xs">加载小红书数据...</span>
        </div>
      ) : !stats ? (
        <div className="bg-panel rounded-md border border-line p-8 text-center text-fainter">
          暂无数据，请先在 XHS-Downloader 中采集作品
        </div>
      ) : (
        <div className="space-y-4">
          {/* ===== 搜索栏 ===== */}
          <div className="bg-panel rounded-md border border-line p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fainter" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchKeyword.trim()) {
                      handleSearch();
                    }
                  }}
                  placeholder="搜索小红书帖子...例如：真丝连衣裙、通勤穿搭、面料测评"
                  className="w-full pl-10 pr-4 py-2.5 border border-line rounded-md text-sm bg-inset text-fg-strong placeholder:text-fainter focus:outline-none focus:border-[#33363d]"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searching || !searchKeyword.trim()}
                className="flex items-center gap-2 bg-ink text-app px-5 py-2.5 rounded-md text-sm font-semibold hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="text-fainter hover:text-fg p-2 rounded-md hover:bg-panel-2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {showSearchResults && searchResults.length > 0 && (
              <div className="mt-3 text-xs text-faint">
                找到 <span className="font-semibold text-fg-strong">{searchResults.length}</span> 条相关结果
              </div>
            )}
          </div>

          {/* ===== 搜索结果 ===== */}
          {showSearchResults && (
            <div className="bg-panel rounded-md border border-line p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-muted" />
                  <h4 className="text-sm font-semibold text-fg">搜索结果</h4>
                  <span className="text-xs text-fainter font-mono">&ldquo;{searchKeyword}&rdquo;</span>
                </div>
              </div>
              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-fainter text-sm">
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
                      className="block p-4 border border-line rounded-md hover:border-[#33363d] hover:bg-panel-2/40 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-medium text-fg-strong group-hover:text-info line-clamp-2">
                            {result.title || "无标题"}
                          </h5>
                          {result.description && (
                            <p className="text-xs text-muted mt-1 line-clamp-2">{result.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-fainter font-mono">
                            <span>{result.author}</span>
                            <span>{result.publish_time}</span>
                            {result.tags && <span className="text-fainter">{result.tags}</span>}
                          </div>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-3 text-xs font-mono">
                          <div className="text-center">
                            <Heart className="w-3.5 h-3.5 text-down mx-auto" />
                            <span className="text-fg font-medium">{result.likes}</span>
                          </div>
                          <div className="text-center">
                            <MessageCircle className="w-3.5 h-3.5 text-info mx-auto" />
                            <span className="text-fg font-medium">{result.comments}</span>
                          </div>
                          <div className="text-center">
                            <Bookmark className="w-3.5 h-3.5 text-warn mx-auto" />
                            <span className="text-fg font-medium">{result.favorites}</span>
                          </div>
                          <ExternalLink className="w-4 h-4 text-fainter group-hover:text-info" />
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
            <div className="bg-panel rounded-md border border-line p-4">
              <h4 className="text-[11px] font-semibold text-fg mb-3">内容类型分布</h4>
              <div className="space-y-2.5">
                {typeDistribution.map((type) => {
                  const pct = totalNotes > 0 ? (type.value / totalNotes) * 100 : 0;
                  const config = TYPE_CONFIG[type.name];
                  return (
                    <div key={type.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          {config && <config.icon className="w-3 h-3 text-muted" />}
                          <span className="text-[11px] text-faint">{type.name}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-fg font-mono">
                          {type.value} <span className="text-fainter font-normal">({pct.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 bg-line-soft rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: type.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* 环形图示意 */}
              <div className="mt-4 flex items-center justify-center">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#1c1e22" strokeWidth="12" />
                    {(() => {
                      let offset = 0;
                      return typeDistribution.map((type) => {
                        const pct = totalNotes > 0 ? type.value / totalNotes : 0;
                        const dash = pct * 251.2; // 2*PI*40
                        const circle = (
                          <circle
                            key={type.name}
                            cx="50"
                            cy="50"
                            r="40"
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
                    <span className="text-lg font-bold text-ink font-display">{totalNotes}</span>
                    <span className="text-[9px] text-fainter font-mono">总作品</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 作者排行榜 */}
            <div className="col-span-2 bg-panel rounded-md border border-line p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[11px] font-semibold text-fg">作者排行榜</h4>
                <span className="text-[10px] text-fainter font-mono">按互动量排序</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[9px] font-mono text-fainter border-b border-line-soft">
                      <th className="text-left font-normal py-1.5 px-2">#</th>
                      <th className="text-left font-normal py-1.5 px-2">作者</th>
                      <th className="text-center font-normal py-1.5 px-2">作品数</th>
                      <th className="text-right font-normal py-1.5 px-2">总互动</th>
                      <th className="text-right font-normal py-1.5 px-2">篇均互动</th>
                      <th className="text-left font-normal py-1.5 px-2 w-32">互动占比</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.top_authors.map((author, idx) => {
                      const avgEng = author.notes > 0 ? Math.round(author.engagement / author.notes) : 0;
                      const sharePct =
                        stats.total_engagement > 0
                          ? (author.engagement / stats.total_engagement) * 100
                          : 0;
                      const isTop = idx < 3;
                      return (
                        <tr key={idx} className="border-b border-line-soft last:border-0 hover:bg-panel-2/50">
                          <td className="py-2 px-2">
                            <span
                              className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold font-mono ${
                                isTop ? "bg-down/15 text-down" : "bg-line-soft text-faint"
                              }`}
                            >
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-[11px] font-medium text-fg-strong">{author.name}</td>
                          <td className="text-center py-2 px-2 text-[11px] text-muted font-mono">{author.notes}</td>
                          <td className="text-right py-2 px-2 text-[11px] font-semibold text-fg-strong font-mono">
                            {formatNum(author.engagement)}
                          </td>
                          <td className="text-right py-2 px-2 text-[11px] text-muted font-mono">
                            {formatNum(avgEng)}
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 h-1.5 bg-line-soft rounded-full overflow-hidden">
                                <div className="h-full bg-info rounded-full" style={{ width: `${sharePct}%` }} />
                              </div>
                              <span className="text-[10px] text-fainter w-8 text-right font-mono">
                                {sharePct.toFixed(0)}%
                              </span>
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
          <div className="bg-panel rounded-md border border-line p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-muted" />
                <h4 className="text-[11px] font-semibold text-fg">全部作品</h4>
                <span className="text-[10px] text-fainter font-mono">· {notes.length} 篇</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[9px] font-mono text-fainter border-b border-line-soft">
                    <th className="text-left font-normal py-2 px-2">#</th>
                    <th className="text-left font-normal py-2 px-2">标题</th>
                    <th className="text-left font-normal py-2 px-2">作者</th>
                    <th className="text-center font-normal py-2 px-2">类型</th>
                    <th className="text-right font-normal py-2 px-2"><Heart className="w-3 h-3 inline" /></th>
                    <th className="text-right font-normal py-2 px-2"><MessageCircle className="w-3 h-3 inline" /></th>
                    <th className="text-right font-normal py-2 px-2"><Share2 className="w-3 h-3 inline" /></th>
                    <th className="text-right font-normal py-2 px-2"><Bookmark className="w-3 h-3 inline" /></th>
                    <th className="text-right font-normal py-2 px-2">互动量</th>
                    <th className="text-right font-normal py-2 px-2">发布时间</th>
                  </tr>
                </thead>
                <tbody>
                  {notes.map((note, idx) => {
                    const engagement =
                      note.liked_count + note.comment_count + note.share_count + note.collect_count;
                    const TypeIcon = TYPE_CONFIG[note.note_type]?.icon || Image;
                    const isHot = idx < 3;
                    return (
                      <tr key={note.note_id} className="border-b border-line-soft last:border-0 hover:bg-panel-2/50">
                        <td className="py-2 px-2">
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold font-mono ${
                              isHot ? "bg-down/15 text-down" : "bg-line-soft text-faint"
                            }`}
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-2 px-2 max-w-[200px]">
                          <a
                            href={note.note_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-medium text-fg-strong hover:text-info hover:underline truncate block"
                          >
                            {note.title || "无标题"}
                          </a>
                          {note.tags && (
                            <div className="text-[10px] text-fainter mt-0.5 truncate font-mono">{note.tags}</div>
                          )}
                        </td>
                        <td className="py-2 px-2 text-[11px] text-muted whitespace-nowrap">{note.author_nickname}</td>
                        <td className="text-center py-2 px-2">
                          <TypeIcon className="w-3 h-3 text-fainter inline" />
                        </td>
                        <td className="text-right py-2 px-2 text-[11px] text-fg font-mono">{formatNum(note.liked_count)}</td>
                        <td className="text-right py-2 px-2 text-[11px] text-fg font-mono">{formatNum(note.comment_count)}</td>
                        <td className="text-right py-2 px-2 text-[11px] text-fg font-mono">{formatNum(note.share_count)}</td>
                        <td className="text-right py-2 px-2 text-[11px] text-fg font-mono">{formatNum(note.collect_count)}</td>
                        <td className={`text-right py-2 px-2 text-[11px] font-semibold font-mono ${isHot ? "text-down" : "text-fg-strong"}`}>
                          {formatNum(engagement)}
                        </td>
                        <td className="text-right py-2 px-2 text-[10px] text-fainter whitespace-nowrap font-mono">
                          {note.publish_time}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ===== 低互动预警 ===== */}
          {stats.low_engagement_notes.length > 0 && (
            <div className="bg-warn/5 rounded-md border border-warn/25 p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <AlertTriangle className="w-3.5 h-3.5 text-warn" />
                <span className="text-[10px] font-semibold text-warn uppercase tracking-[0.14em] font-mono">
                  低互动预警
                </span>
                <span className="text-[10px] text-warn/80 font-mono">互动量 &lt; 50 的作品</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {stats.low_engagement_notes.map((note) => {
                  const engagement =
                    note.liked_count + note.comment_count + note.share_count + note.collect_count;
                  return (
                    <div
                      key={note.note_id}
                      className="flex items-center gap-2 bg-panel/60 rounded-md p-2 border border-line-soft"
                    >
                      <div className="flex-1 min-w-0">
                        <a
                          href={note.note_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-medium text-fg hover:text-info truncate block"
                        >
                          {note.title || "无标题"}
                        </a>
                        <div className="text-[10px] text-fainter font-mono">{note.author_nickname}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-[11px] font-bold text-warn font-mono">{engagement}</div>
                        <div className="text-[9px] text-fainter font-mono">互动</div>
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
