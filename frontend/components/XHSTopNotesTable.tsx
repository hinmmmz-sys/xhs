"use client";

import { Flame, Heart, MessageCircle, Share2, Bookmark, Video, Image, Images } from "lucide-react";
import type { XHSNoteRecord } from "@/lib/types";

interface XHSTopNotesTableProps {
  notes: XHSNoteRecord[];
}

function formatNum(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  return value.toLocaleString("zh-CN");
}

const TYPE_ICON: Record<string, any> = {
  视频: Video,
  图文: Image,
  图集: Images,
};

export default function XHSTopNotesTable({ notes }: XHSTopNotesTableProps) {
  return (
    <div className="bg-panel rounded-md border border-line overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
        <Flame className="w-3.5 h-3.5 text-muted" />
        <h3 className="text-[11px] font-semibold text-fg">小红书爆款笔记</h3>
        <span className="text-[10px] text-fainter font-mono ml-auto">按互动量排序</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-[9px] font-mono text-fainter tracking-[0.05em] border-b border-line-soft">
              <th className="text-left font-normal py-2.5 px-4">#</th>
              <th className="text-left font-normal py-2.5 px-2">标题</th>
              <th className="text-left font-normal py-2.5 px-2">作者</th>
              <th className="text-center font-normal py-2.5 px-2">类型</th>
              <th className="text-right font-normal py-2.5 px-2">
                <Heart className="w-3 h-3 inline" /> 点赞
              </th>
              <th className="text-right font-normal py-2.5 px-2">
                <MessageCircle className="w-3 h-3 inline" /> 评论
              </th>
              <th className="text-right font-normal py-2.5 px-2">
                <Share2 className="w-3 h-3 inline" /> 分享
              </th>
              <th className="text-right font-normal py-2.5 px-2">
                <Bookmark className="w-3 h-3 inline" /> 收藏
              </th>
              <th className="text-right font-normal py-2.5 px-4">互动量</th>
            </tr>
          </thead>
          <tbody>
            {notes.map((note, idx) => {
              const TypeIcon = TYPE_ICON[note.note_type] || Image;
              const engagement =
                note.liked_count +
                note.comment_count +
                note.share_count +
                note.collect_count;
              const isHot = idx < 3;
              return (
                <tr
                  key={note.note_id}
                  className="border-b border-line-soft last:border-0 hover:bg-panel-2/50"
                >
                  <td className="py-2.5 px-4">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold font-mono ${
                        isHot
                          ? "bg-down/15 text-down"
                          : "bg-line-soft text-faint"
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 max-w-[200px]">
                    <a
                      href={note.note_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-fg-strong hover:text-info hover:underline truncate block"
                    >
                      {note.title || "无标题"}
                    </a>
                    {note.tags && (
                      <div className="text-[10px] text-fainter mt-0.5 truncate font-mono">
                        {note.tags}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-[11px] text-muted whitespace-nowrap">
                    {note.author_nickname}
                  </td>
                  <td className="text-center py-2.5 px-2">
                    <TypeIcon className="w-3.5 h-3.5 text-fainter inline" />
                  </td>
                  <td className="text-right py-2.5 px-2 text-[11px] text-fg font-mono">
                    {formatNum(note.liked_count)}
                  </td>
                  <td className="text-right py-2.5 px-2 text-[11px] text-fg font-mono">
                    {formatNum(note.comment_count)}
                  </td>
                  <td className="text-right py-2.5 px-2 text-[11px] text-fg font-mono">
                    {formatNum(note.share_count)}
                  </td>
                  <td className="text-right py-2.5 px-2 text-[11px] text-fg font-mono">
                    {formatNum(note.collect_count)}
                  </td>
                  <td
                    className={`text-right py-2.5 px-4 text-[11px] font-semibold font-mono ${
                      isHot ? "text-down" : "text-fg-strong"
                    }`}
                  >
                    {formatNum(engagement)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
