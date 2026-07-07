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
  "视频": Video,
  "图文": Image,
  "图集": Images,
};

export default function XHSTopNotesTable({ notes }: XHSTopNotesTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-4 h-4 text-red-500" />
        <h3 className="text-sm font-semibold text-gray-700">小红书爆款笔记</h3>
        <span className="text-xs text-gray-400">· 按互动量排序</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left font-medium py-2 px-2">#</th>
              <th className="text-left font-medium py-2 px-2">标题</th>
              <th className="text-left font-medium py-2 px-2">作者</th>
              <th className="text-center font-medium py-2 px-2">类型</th>
              <th className="text-right font-medium py-2 px-2">
                <Heart className="w-3 h-3 inline" /> 点赞
              </th>
              <th className="text-right font-medium py-2 px-2">
                <MessageCircle className="w-3 h-3 inline" /> 评论
              </th>
              <th className="text-right font-medium py-2 px-2">
                <Share2 className="w-3 h-3 inline" /> 分享
              </th>
              <th className="text-right font-medium py-2 px-2">
                <Bookmark className="w-3 h-3 inline" /> 收藏
              </th>
              <th className="text-right font-medium py-2 px-2">互动量</th>
            </tr>
          </thead>
          <tbody>
            {notes.map((note, idx) => {
              const TypeIcon = TYPE_ICON[note.note_type] || Image;
              const engagement = note.liked_count + note.comment_count + note.share_count + note.collect_count;
              const isHot = idx < 3;
              return (
                <tr key={note.note_id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2.5 px-2">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      isHot ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"
                    }`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 max-w-[200px]">
                    <a
                      href={note.note_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-gray-700 hover:text-blue-600 hover:underline truncate block"
                    >
                      {note.title || "无标题"}
                    </a>
                    {note.tags && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate">{note.tags}</div>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-xs text-gray-500 whitespace-nowrap">
                    {note.author_nickname}
                  </td>
                  <td className="text-center py-2.5 px-2">
                    <TypeIcon className="w-3.5 h-3.5 text-gray-400 inline" />
                  </td>
                  <td className="text-right py-2.5 px-2 text-xs text-gray-600">{formatNum(note.liked_count)}</td>
                  <td className="text-right py-2.5 px-2 text-xs text-gray-600">{formatNum(note.comment_count)}</td>
                  <td className="text-right py-2.5 px-2 text-xs text-gray-600">{formatNum(note.share_count)}</td>
                  <td className="text-right py-2.5 px-2 text-xs text-gray-600">{formatNum(note.collect_count)}</td>
                  <td className={`text-right py-2.5 px-2 text-xs font-semibold ${isHot ? "text-red-600" : "text-gray-700"}`}>
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
