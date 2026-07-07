"""小红书搜索服务 - 基于本地数据库的全文搜索"""

import json
import os
from pathlib import Path
from typing import Optional
import httpx

XHS_API_BASE = "http://127.0.0.1:5556"

# 本地数据库路径
DB_PATH = Path(__file__).parent.parent / "data" / "xhs_notes_db.json"

# 缓存数据库
_db_cache: Optional[dict] = None


def _load_db() -> dict:
    """加载本地数据库（带缓存）"""
    global _db_cache
    if _db_cache is not None:
        return _db_cache

    if DB_PATH.exists():
        with open(DB_PATH, "r", encoding="utf-8") as f:
            _db_cache = json.load(f)
            return _db_cache

    # 如果数据库文件不存在，返回空数据库
    return {"total": 0, "keywords": [], "notes": []}


def _parse_likes(likes_str: str) -> float:
    """将点赞数字符串转为数字（支持'万'单位）"""
    if not likes_str:
        return 0
    likes_str = likes_str.strip()
    if "万" in likes_str:
        return float(likes_str.replace("万", "")) * 10000
    try:
        return float(likes_str)
    except ValueError:
        return 0


def _calculate_relevance(note: dict, keyword: str) -> float:
    """
    计算搜索结果与关键词的相关度分数
    
    评分规则：
    - 标题完全匹配关键词：+100
    - 标题包含关键词：+50
    - 搜索关键词标签完全匹配：+30
    - 搜索关键词标签包含关键词：+15
    - 作者名包含关键词：+10
    - 点赞数加权：点赞数/1000（最多+20）
    """
    score = 0
    keyword_lower = keyword.lower().strip()
    title = note.get("title", "").lower()
    author = note.get("author", "").lower()
    search_keywords = [k.lower() for k in note.get("search_keywords", [])]

    # 标题匹配
    if keyword_lower == title:
        score += 100
    elif keyword_lower in title:
        score += 50
    else:
        # 分词匹配：关键词的每个字都在标题中
        chars = set(keyword_lower)
        title_chars = set(title)
        overlap = chars & title_chars
        if chars and len(overlap) / len(chars) > 0.5:
            score += 20

    # 搜索关键词标签匹配
    for sk in search_keywords:
        if keyword_lower == sk:
            score += 30
        elif keyword_lower in sk or sk in keyword_lower:
            score += 15
        else:
            # 分词匹配
            for char in keyword_lower:
                if char in sk:
                    score += 2

    # 作者匹配
    if keyword_lower in author:
        score += 10

    # 点赞数加权（最多加20分）
    likes = _parse_likes(note.get("likes", "0"))
    score += min(likes / 1000, 20)

    return score


async def search_xhs_notes(keyword: str, max_results: int = 20) -> list[dict]:
    """
    搜索小红书帖子 - 从本地数据库全文搜索
    
    支持任意关键词搜索，基于本地176条真实数据。
    搜索范围：标题、作者、搜索关键词标签。
    按相关度排序返回最匹配的结果。
    """
    db = _load_db()
    notes = db.get("notes", [])

    if not notes:
        return []

    keyword = keyword.strip()
    keyword_lower = keyword.lower()

    # 计算每条记录的相关度
    scored_results = []
    for note in notes:
        score = _calculate_relevance(note, keyword)
        if score > 0:
            scored_results.append((score, note))

    # 按相关度降序排序
    scored_results.sort(key=lambda x: x[0], reverse=True)

    # 取前 max_results 条
    results = [note for _, note in scored_results[:max_results]]

    # 如果没有匹配结果，返回按点赞数排序的热门内容
    if not results:
        results = sorted(notes, key=lambda n: _parse_likes(n.get("likes", "0")), reverse=True)[:max_results]

    # 格式化输出
    formatted = []
    for note in results:
        formatted.append({
            "id": note.get("id", ""),
            "title": note.get("title", ""),
            "description": "",
            "type": note.get("type", "图文"),
            "author": note.get("author", ""),
            "author_id": "",
            "likes": note.get("likes", "0"),
            "comments": "0",
            "favorites": "0",
            "shares": "0",
            "publish_time": note.get("publish_time", ""),
            "url": note.get("url", ""),
            "tags": " ".join(note.get("search_keywords", [])),
        })

    return formatted


async def get_note_detail(url: str) -> Optional[dict]:
    """获取单个帖子的详细信息"""
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.post(
                f"{XHS_API_BASE}/xhs/detail",
                json={"url": url, "download": False},
            )

            if resp.status_code == 200:
                data = resp.json()
                if data.get("data"):
                    note_data = data["data"]
                    return {
                        "id": note_data.get("作品ID", ""),
                        "title": note_data.get("作品标题", ""),
                        "description": note_data.get("作品描述", ""),
                        "type": note_data.get("作品类型", ""),
                        "author": note_data.get("作者昵称", ""),
                        "author_id": note_data.get("作者ID", ""),
                        "likes": note_data.get("点赞数量", "0"),
                        "comments": note_data.get("评论数量", "0"),
                        "favorites": note_data.get("收藏数量", "0"),
                        "shares": note_data.get("分享数量", "0"),
                        "publish_time": note_data.get("发布时间", ""),
                        "url": note_data.get("作品链接", url),
                        "tags": note_data.get("作品标签", ""),
                    }
        except Exception as e:
            print(f"Error fetching detail: {e}")

    return None
