"use client";

import { Heart, MessageCircle, Share2, Bookmark, Flame, TrendingUp } from "lucide-react";
import type { XHSStats } from "@/lib/types";

interface XHSOverviewCardProps {
  stats: XHSStats;
}

function formatNum(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  return value.toLocaleString("zh-CN");
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-md bg-inset border border-line flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-muted" />
      </div>
      <div>
        <div className="text-sm font-bold text-ink tabular font-display">
          {formatNum(value)}
        </div>
        <div className="text-[10px] text-fainter font-mono">{label}</div>
      </div>
    </div>
  );
}

export default function XHSOverviewCard({ stats }: XHSOverviewCardProps) {
  return (
    <div className="bg-panel rounded-md border border-line p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-muted" />
          <h3 className="text-sm font-semibold text-fg">小红书种草概览</h3>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-faint font-mono">
          <TrendingUp className="w-3 h-3" />
          均互动 {formatNum(stats.avg_engagement)}
        </div>
      </div>

      {/* 统计指标行 */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        <StatPill icon={Heart} label="点赞" value={stats.total_likes} />
        <StatPill icon={MessageCircle} label="评论" value={stats.total_comments} />
        <StatPill icon={Share2} label="分享" value={stats.total_shares} />
        <StatPill icon={Bookmark} label="收藏" value={stats.total_collects} />
        <StatPill icon={Flame} label="总互动" value={stats.total_engagement} />
      </div>

      {/* 类型分布 + Top作者 */}
      <div className="flex items-center justify-between pt-3 border-t border-line-soft">
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-faint">
            共 <span className="font-semibold text-fg-strong">{stats.total_notes}</span> 篇作品
          </span>
          <span className="text-fainter">|</span>
          <span className="text-faint">
            视频 <span className="font-semibold text-fg-strong">{stats.video_count}</span>
          </span>
          <span className="text-faint">
            图文 <span className="font-semibold text-fg-strong">{stats.image_count}</span>
          </span>
          <span className="text-faint">
            图集 <span className="font-semibold text-fg-strong">{stats.gallery_count}</span>
          </span>
        </div>
        {stats.top_authors.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-fainter font-mono">Top 作者:</span>
            {stats.top_authors.slice(0, 3).map((author, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 bg-inset border border-line-soft rounded text-fg"
              >
                {author.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
