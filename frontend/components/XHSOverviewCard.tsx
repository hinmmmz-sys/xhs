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

function StatPill({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: { bg: string; text: string } }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-lg ${color.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-3.5 h-3.5 ${color.text}`} />
      </div>
      <div>
        <div className="text-sm font-bold text-gray-800">{formatNum(value)}</div>
        <div className="text-xs text-gray-400">{label}</div>
      </div>
    </div>
  );
}

const COLORS = {
  red: { bg: "bg-red-50", text: "text-red-500" },
  blue: { bg: "bg-blue-50", text: "text-blue-500" },
  green: { bg: "bg-green-50", text: "text-green-500" },
  amber: { bg: "bg-amber-50", text: "text-amber-500" },
  purple: { bg: "bg-purple-50", text: "text-purple-500" },
};

export default function XHSOverviewCard({ stats }: XHSOverviewCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-semibold text-gray-700">小红书种草概览</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <TrendingUp className="w-3 h-3" />
          均互动 {formatNum(stats.avg_engagement)}
        </div>
      </div>

      {/* 统计指标行 */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        <StatPill icon={Heart} label="点赞" value={stats.total_likes} color={COLORS.red} />
        <StatPill icon={MessageCircle} label="评论" value={stats.total_comments} color={COLORS.blue} />
        <StatPill icon={Share2} label="分享" value={stats.total_shares} color={COLORS.green} />
        <StatPill icon={Bookmark} label="收藏" value={stats.total_collects} color={COLORS.amber} />
        <StatPill icon={Flame} label="总互动" value={stats.total_engagement} color={COLORS.purple} />
      </div>

      {/* 类型分布 + Top作者 */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-500">
            共 <span className="font-semibold text-gray-700">{stats.total_notes}</span> 篇作品
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-500">
            视频 <span className="font-semibold text-gray-700">{stats.video_count}</span>
          </span>
          <span className="text-gray-500">
            图文 <span className="font-semibold text-gray-700">{stats.image_count}</span>
          </span>
          <span className="text-gray-500">
            图集 <span className="font-semibold text-gray-700">{stats.gallery_count}</span>
          </span>
        </div>
        {stats.top_authors.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-400">Top 作者:</span>
            {stats.top_authors.slice(0, 3).map((author, i) => (
              <span key={i} className="px-1.5 py-0.5 bg-gray-50 rounded text-gray-600">
                {author.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
