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
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  BarChart3,
} from "lucide-react";
import { getXHSStats, getXHSNotes, syncXHS, searchXHS, getKeywordTrend } from "@/lib/api";
import type { XHSStats, XHSNoteRecord } from "@/lib/types";
import type { KeywordTrendData } from "@/lib/api";
import XHSOverviewCard from "@/components/XHSOverviewCard";

function formatNum(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  return value.toLocaleString("zh-CN");
}

function parseNum(value: string): number {
  if (!value) return 0;
  const text = String(value).trim();
  if (text.includes("万")) return parseFloat(text.replace("万", "")) * 10000;
  if (text.includes("亿")) return parseFloat(text.replace("亿", "")) * 100000000;
  const n = parseFloat(text);
  return isNaN(n) ? 0 : Math.max(n, 0);
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

  // 搜索结果展开/折叠
  const [resultsExpanded, setResultsExpanded] = useState(false);
  const COLLAPSED_COUNT = 5;

  // 关键词趋势数据
  const [trendData, setTrendData] = useState<KeywordTrendData | null>(null);

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
    setResultsExpanded(false); // 搜索后默认折叠
    try {
      const result = await searchXHS(searchKeyword, 9999);
      setSearchResults(result.notes);

      // 获取趋势数据
      try {
        const trend = await getKeywordTrend(searchKeyword);
        setTrendData(trend);
      } catch (err) {
        setTrendData(null);
      }
    } catch (err) {
      console.error("搜索失败:", err);
      setSearchResults([]);
      setTrendData(null);
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

  // 从搜索结果计算分析数据（搜索与分析联动）
  const searchStats = showSearchResults && searchResults.length > 0
    ? (() => {
        let totalLikes = 0, totalComments = 0, totalShares = 0, totalCollects = 0;
        let videoCount = 0, imageCount = 0, galleryCount = 0;
        const authorMap: Record<string, { name: string; notes: number; engagement: number }> = {};

        for (const r of searchResults) {
          const likes = parseNum(r.likes);
          const comments = parseNum(r.comments);
          const shares = parseNum(r.shares || "0");
          const favorites = parseNum(r.favorites || "0");
          totalLikes += likes;
          totalComments += comments;
          totalShares += shares;
          totalCollects += favorites;
          if (r.type === "视频") videoCount++;
          else if (r.type === "图集") galleryCount++;
          else imageCount++;
          // 作者聚合
          if (r.author) {
            if (!authorMap[r.author]) authorMap[r.author] = { name: r.author, notes: 0, engagement: 0 };
            authorMap[r.author].notes++;
            authorMap[r.author].engagement += likes + comments + shares + favorites;
          }
        }
        const totalEngagement = totalLikes + totalComments + totalShares + totalCollects;
        const topAuthors = Object.values(authorMap)
          .sort((a, b) => b.engagement - a.engagement)
          .slice(0, 10);
        return {
          total_notes: searchResults.length,
          total_likes: totalLikes,
          total_comments: totalComments,
          total_shares: totalShares,
          total_collects: totalCollects,
          total_engagement: totalEngagement,
          avg_engagement: searchResults.length > 0 ? Math.round(totalEngagement / searchResults.length) : 0,
          video_count: videoCount,
          image_count: imageCount,
          gallery_count: galleryCount,
          top_authors: topAuthors,
          low_engagement_notes: [],
          trending_notes: [],
        };
      })()
    : null;

  // 展示用的统计：搜索时用搜索结果计算的，否则用本地数据
  const displayStats = searchStats || stats;
  const displayTypeDistribution = searchStats
    ? [
        { name: "视频", value: searchStats.video_count, color: TYPE_CONFIG["视频"].color },
        { name: "图文", value: searchStats.image_count, color: TYPE_CONFIG["图文"].color },
        { name: "图集", value: searchStats.gallery_count, color: TYPE_CONFIG["图集"].color },
      ].filter((t) => t.value > 0)
    : typeDistribution;
  const displayTotalNotes = displayTypeDistribution.reduce((sum, t) => sum + t.value, 0);

  // 折叠时显示的结果
  const visibleResults = resultsExpanded ? searchResults : searchResults.slice(0, COLLAPSED_COUNT);
  const hasMoreResults = searchResults.length > COLLAPSED_COUNT;

  // 趋势卡片
  const trendConfig = (() => {
    if (!trendData || !trendData.has_data) return null;
    const trend = trendData.trend;
    const isUp = trend === "up";
    const isDown = trend === "down";
    const isNew = trend === "new";
    const Icon = isUp ? TrendingUp : isDown ? TrendingDown : isNew ? TrendingUp : Minus;
    const color = isUp ? "text-up" : isDown ? "text-down" : "text-faint";
    const bgColor = isUp ? "bg-up/5" : isDown ? "bg-down/5" : "bg-panel-2/50";
    const borderColor = isUp ? "border-up/20" : isDown ? "border-down/20" : "border-line";
    const label = isUp ? "上升" : isDown ? "下降" : isNew ? "首次记录" : "持平";
    return { Icon, color, bgColor, borderColor, label };
  })();

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
                  placeholder="搜索关键词，例如：外劳、真丝连衣裙、通勤穿搭、面料测评"
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
                    setTrendData(null);
                    setResultsExpanded(false);
                  }}
                  className="text-fainter hover:text-fg p-2 rounded-md hover:bg-panel-2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {showSearchResults && (
              <div className="mt-3 text-xs text-faint">
                {searchResults.length > 0 ? (
                  <>找到 <span className="font-semibold text-fg-strong">{searchResults.length}</span> 条相关结果</>
                ) : (
                  <>未找到相关结果，本地索引中无匹配数据。更新 Cookie 后可搜索小红书全站内容</>
                )}
                {trendData && trendData.has_data && trendData.snapshot_count && (
                  <span className="ml-3 text-fainter">
                    · 历史快照 {trendData.snapshot_count} 次
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ===== 关键词趋势分析 ===== */}
          {showSearchResults && trendData && trendData.has_data && trendConfig && (
            <div className={`rounded-md border ${trendConfig.borderColor} ${trendConfig.bgColor} p-4`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-muted" />
                  <h4 className="text-sm font-semibold text-fg">关键词趋势分析</h4>
                  <span className="text-xs text-fainter font-mono">&ldquo;{trendData.keyword}&rdquo;</span>
                </div>
                <div className="flex items-center gap-2">
                  <trendConfig.Icon className={`w-4 h-4 ${trendConfig.color}`} />
                  <span className={`text-xs font-bold ${trendConfig.color}`}>{trendConfig.label}</span>
                  {trendData.engagement_change_pct !== undefined && (
                    <span className={`text-xs font-mono ${trendConfig.color}`}>
                      {trendData.engagement_change_pct > 0 ? "+" : ""}{trendData.engagement_change_pct}%
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-5 gap-3">
                {/* 总互动量 */}
                <TrendMetric
                  label="总互动"
                  current={trendData.latest?.total_engagement || 0}
                  change={trendData.engagement_change}
                  changePct={trendData.engagement_change_pct}
                  trend={trendData.trend}
                  icon={<BarChart3 className="w-3 h-3" />}
                />
                {/* 笔记数 */}
                <TrendMetric
                  label="笔记数"
                  current={trendData.latest?.total_notes || 0}
                  change={trendData.notes_change}
                  trend={trendData.trend}
                  icon={<Flame className="w-3 h-3" />}
                />
                {/* 点赞数 */}
                <TrendMetric
                  label="总点赞"
                  current={trendData.latest?.total_likes || 0}
                  change={trendData.likes_change}
                  trend={trendData.trend}
                  icon={<Heart className="w-3 h-3" />}
                />
                {/* 评论数 */}
                <TrendMetric
                  label="总评论"
                  current={trendData.latest?.total_comments || 0}
                  change={trendData.comments_change}
                  trend={trendData.trend}
                  icon={<MessageCircle className="w-3 h-3" />}
                />
                {/* 作者数 */}
                <TrendMetric
                  label="独立作者"
                  current={trendData.latest?.unique_authors || 0}
                  change={trendData.authors_change}
                  trend={trendData.trend}
                  icon={<Users className="w-3 h-3" />}
                />
              </div>

              {/* 历史趋势迷你图 */}
              {trendData.history && trendData.history.length > 1 && (
                <div className="mt-4 pt-3 border-t border-line-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-fainter font-mono">互动量趋势（最近 {trendData.history.length} 次搜索）</span>
                    <div className="flex items-center gap-2 text-[10px] text-fainter font-mono">
                      <span>{trendData.history[0].date} {trendData.history[0].time}</span>
                      <ChevronRight className="w-2.5 h-2.5" />
                      <span>{trendData.latest?.date} {trendData.latest?.time}</span>
                    </div>
                  </div>
                  <MiniTrendChart history={trendData.history} />
                </div>
              )}
            </div>
          )}

          {/* ===== 概览统计 ===== */}
          {displayStats && <XHSOverviewCard stats={displayStats} />}

          {/* ===== 类型分布 + 作者排行 ===== */}
          <div className="grid grid-cols-3 gap-3">
            {/* 内容类型分布 */}
            <div className="bg-panel rounded-md border border-line p-4">
              <h4 className="text-[11px] font-semibold text-fg mb-3">内容类型分布</h4>
              <div className="space-y-2.5">
                {displayTypeDistribution.map((type) => {
                  const pct = displayTotalNotes > 0 ? (type.value / displayTotalNotes) * 100 : 0;
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
                      return displayTypeDistribution.length > 0
                        ? displayTypeDistribution.map((type) => {
                            const pct = displayTotalNotes > 0 ? type.value / displayTotalNotes : 0;
                            const dash = pct * 251.2;
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
                          })
                        : null;
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-ink font-display">{displayTotalNotes}</span>
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
                    {displayStats && displayStats.top_authors.map((author, idx) => {
                      const avgEng = author.notes > 0 ? Math.round(author.engagement / author.notes) : 0;
                      const sharePct =
                        displayStats && displayStats.total_engagement > 0
                          ? (author.engagement / displayStats.total_engagement) * 100
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

          {/* ===== 搜索结果（可折叠）===== */}
          {showSearchResults && (
            <div className="bg-panel rounded-md border border-line p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-muted" />
                  <h4 className="text-sm font-semibold text-fg">搜索结果</h4>
                  <span className="text-xs text-fainter font-mono">&ldquo;{searchKeyword}&rdquo;</span>
                  <span className="text-[10px] text-faint bg-panel-2 border border-line px-2 py-0.5 rounded-full font-mono">
                    {searchResults.length} 条
                  </span>
                </div>
                {hasMoreResults && (
                  <button
                    onClick={() => setResultsExpanded(!resultsExpanded)}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-info hover:text-info/80 bg-info/5 border border-info/20 px-3 py-1.5 rounded-md transition-colors"
                  >
                    {resultsExpanded ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        收起结果
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        展开全部 {searchResults.length} 条
                      </>
                    )}
                  </button>
                )}
              </div>
              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-fainter text-sm">
                  未找到相关帖子，请尝试其他关键词
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {visibleResults.map((result, idx) => (
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
                  {/* 折叠时的渐变遮罩提示 */}
                  {!resultsExpanded && hasMoreResults && (
                    <div className="mt-3 text-center">
                      <button
                        onClick={() => setResultsExpanded(true)}
                        className="text-[11px] text-faint hover:text-info transition-colors"
                      >
                        还有 {searchResults.length - COLLAPSED_COUNT} 条结果，点击展开查看
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ===== 全量笔记表 ===== */}
          <div className="bg-panel rounded-md border border-line p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-muted" />
                <h4 className="text-[11px] font-semibold text-fg">
                  {showSearchResults ? "搜索结果作品" : "全部作品"}
                </h4>
                <span className="text-[10px] text-fainter font-mono">
                  · {showSearchResults ? searchResults.length : notes.length} 篇
                </span>
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
                  {showSearchResults && searchResults.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-fainter text-sm">
                        未找到相关帖子，请尝试其他关键词
                      </td>
                    </tr>
                  ) : (
                    (showSearchResults ? searchResults : notes).map((item: any, idx: number) => {
                      const isSearch = showSearchResults;
                    const title = item.title || "无标题";
                    const author = isSearch ? item.author : item.author_nickname;
                    const noteUrl = isSearch ? item.url : item.note_url;
                    const noteId = isSearch ? item.id : item.note_id;
                    const noteType = isSearch ? item.type : item.note_type;
                    const likes = isSearch ? parseNum(item.likes) : item.liked_count;
                    const comments = isSearch ? parseNum(item.comments) : item.comment_count;
                    const shares = isSearch ? parseNum(item.shares || "0") : item.share_count;
                    const collects = isSearch ? parseNum(item.favorites || "0") : item.collect_count;
                    const engagement = likes + comments + shares + collects;
                    const pubTime = item.publish_time;
                    const tags = item.tags;
                    const TypeIcon = TYPE_CONFIG[noteType]?.icon || Image;
                    const isHot = idx < 3;
                    return (
                      <tr key={noteId || idx} className="border-b border-line-soft last:border-0 hover:bg-panel-2/50">
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
                            href={noteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-medium text-fg-strong hover:text-info hover:underline truncate block"
                          >
                            {title}
                          </a>
                          {tags && (
                            <div className="text-[10px] text-fainter mt-0.5 truncate font-mono">{tags}</div>
                          )}
                        </td>
                        <td className="py-2 px-2 text-[11px] text-muted whitespace-nowrap">{author}</td>
                        <td className="text-center py-2 px-2">
                          <TypeIcon className="w-3 h-3 text-fainter inline" />
                        </td>
                        <td className="text-right py-2 px-2 text-[11px] text-fg font-mono">{formatNum(likes)}</td>
                        <td className="text-right py-2 px-2 text-[11px] text-fg font-mono">{formatNum(comments)}</td>
                        <td className="text-right py-2 px-2 text-[11px] text-fg font-mono">{formatNum(shares)}</td>
                        <td className="text-right py-2 px-2 text-[11px] text-fg font-mono">{formatNum(collects)}</td>
                        <td className={`text-right py-2 px-2 text-[11px] font-semibold font-mono ${isHot ? "text-down" : "text-fg-strong"}`}>
                          {formatNum(engagement)}
                        </td>
                        <td className="text-right py-2 px-2 text-[10px] text-fainter whitespace-nowrap font-mono">
                          {pubTime}
                        </td>
                      </tr>
                    );
                  })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ===== 低互动预警 ===== */}
          {stats && stats.low_engagement_notes && stats.low_engagement_notes.length > 0 && !showSearchResults && (
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

// ===== 趋势指标卡片组件 =====
function TrendMetric({
  label,
  current,
  change,
  changePct,
  trend,
  icon,
}: {
  label: string;
  current: number;
  change?: number;
  changePct?: number;
  trend?: string;
  icon: React.ReactNode;
}) {
  const isUp = (change ?? 0) > 0;
  const isDown = (change ?? 0) < 0;
  const changeColor = isUp ? "text-up" : isDown ? "text-down" : "text-faint";
  const ArrowIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

  return (
    <div className="bg-panel/60 rounded-md border border-line-soft p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-muted">{icon}</span>
        <span className="text-[10px] text-fainter font-mono uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-lg font-bold text-fg-strong font-display">
        {formatNum(current)}
      </div>
      {change !== undefined && change !== 0 && (
        <div className={`flex items-center gap-1 mt-1 ${changeColor}`}>
          <ArrowIcon className="w-3 h-3" />
          <span className="text-[10px] font-mono">
            {change > 0 ? "+" : ""}{formatNum(Math.abs(change))}
            {changePct !== undefined && ` (${changePct > 0 ? "+" : ""}${changePct}%)`}
          </span>
        </div>
      )}
      {change === 0 && (
        <div className="flex items-center gap-1 mt-1 text-faint">
          <Minus className="w-3 h-3" />
          <span className="text-[10px] font-mono">持平</span>
        </div>
      )}
    </div>
  );
}

// ===== 迷你趋势图 =====
function MiniTrendChart({ history }: { history: Array<{ total_engagement: number; date: string; time: string }> }) {
  if (!history || history.length < 2) return null;

  const values = history.map(h => h.total_engagement);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const width = 100;
  const height = 30;
  const step = width / (history.length - 1);

  // 生成折线路径
  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(" L ")}`;
  const areaPath = `M 0,${height} L ${points.join(" L ")} L ${width},${height} Z`;

  return (
    <div className="relative h-12">
      <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4a90d9" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4a90d9" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#trendGrad)" />
        <path d={linePath} fill="none" stroke="#4a90d9" strokeWidth="1.5" />
        {points.map((p, i) => {
          const [x, y] = p.split(",").map(Number);
          return <circle key={i} cx={x} cy={y} r="1.5" fill="#4a90d9" />;
        })}
      </svg>
      <div className="absolute right-0 top-0 text-[9px] text-fainter font-mono">
        {formatNum(max)}
      </div>
      <div className="absolute right-0 bottom-0 text-[9px] text-fainter font-mono">
        {formatNum(min)}
      </div>
    </div>
  );
}
