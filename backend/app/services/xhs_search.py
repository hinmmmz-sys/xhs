"""小红书搜索服务 — 统一搜索引擎

数据源：
1. ExploreData.db — XHS-Downloader 采集的真实笔记（49条）
2. xhs_notes_db.json — 预置搜索数据库（176条）
3. XHS-Downloader API — 实时 URL 抓取（port 5556）
"""

import json
import re
import sqlite3
from pathlib import Path
from typing import Optional

import httpx

from app.config import get_settings

XHS_API_BASE = "http://127.0.0.1:5556"

# 小红书链接正则
XHS_URL_PATTERN = re.compile(
    r"(?:https?://)?(?:www\.)?(?:xiaohongshu\.com|rednote\.com)"
    r"(?:/explore/|/discovery/item/|/user/profile/)\S+"
)
XHS_SHORT_PATTERN = re.compile(r"(?:https?://)?xhslink\.com/\S+")
USER_PROFILE_PATTERN = re.compile(
    r"(?:https?://)?(?:www\.)?(?:xiaohongshu\.com|rednote\.com)/user/profile/([a-z0-9]+)"
)

# 缓存
_search_index: Optional[list[dict]] = None


def _build_search_index() -> list[dict]:
    """构建统一搜索索引（合并 ExploreData.db + JSON DB）"""
    global _search_index
    if _search_index is not None:
        return _search_index

    notes_map: dict[str, dict] = {}  # 用 ID 去重

    # ---- 数据源1: ExploreData.db ----
    settings = get_settings()
    db_path = Path(settings.xhs_data_path) / "Download" / "ExploreData.db"
    if db_path.exists():
        try:
            conn = sqlite3.connect(str(db_path))
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM explore_data")
            for row in cursor.fetchall():
                note_id = str(row["作品ID"]) if row["作品ID"] else ""
                if not note_id:
                    continue
                notes_map[note_id] = {
                    "id": note_id,
                    "title": str(row["作品标题"] or ""),
                    "description": str(row["作品描述"] or "")[:300],
                    "type": str(row["作品类型"] or "图文"),
                    "author": str(row["作者昵称"] or ""),
                    "author_id": str(row["作者ID"] or ""),
                    "likes": str(row["点赞数量"] or "0"),
                    "comments": str(row["评论数量"] or "0"),
                    "favorites": str(row["收藏数量"] or "0"),
                    "shares": str(row["分享数量"] or "0"),
                    "publish_time": str(row["发布时间"] or "").replace("_", " "),
                    "url": str(row["作品链接"] or ""),
                    "tags": str(row["作品标签"] or ""),
                    "source": "explore_db",
                }
            conn.close()
        except Exception as e:
            print(f"[WARN] 读取 ExploreData.db 失败: {e}")

    # ---- 数据源2: xhs_notes_db.json ----
    json_path = Path(__file__).parent.parent / "data" / "xhs_notes_db.json"
    if json_path.exists():
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                db = json.load(f)
            for note in db.get("notes", []):
                note_id = note.get("id", "")
                if not note_id or note_id in notes_map:
                    continue  # 去重
                notes_map[note_id] = {
                    "id": note_id,
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
                    "source": "json_db",
                }
        except Exception as e:
            print(f"[WARN] 读取 xhs_notes_db.json 失败: {e}")

    _search_index = list(notes_map.values())
    print(f"[INFO] 搜索索引构建完成: {len(_search_index)} 条笔记")
    return _search_index


def invalidate_cache():
    """清除搜索缓存（数据更新后调用）"""
    global _search_index
    _search_index = None


def _is_xhs_url(text: str) -> bool:
    """检测输入是否为小红书链接"""
    text = text.strip()
    return bool(XHS_URL_PATTERN.search(text) or XHS_SHORT_PATTERN.search(text))


def _is_user_profile_url(text: str) -> bool:
    """检测输入是否为用户主页链接"""
    return bool(USER_PROFILE_PATTERN.search(text.strip()))


def _parse_number(value: str) -> float:
    """解析数字（支持万/亿）"""
    if not value:
        return 0
    text = str(value).strip()
    try:
        if "万" in text:
            return float(text.replace("万", "")) * 10000
        if "亿" in text:
            return float(text.replace("亿", "")) * 100000000
        return max(float(text), 0)
    except (ValueError, TypeError):
        return 0


def _calculate_relevance(note: dict, keyword: str) -> float:
    """
    计算相关度分数

    评分规则：
    - 标题完全匹配: +100
    - 标题包含关键词: +50
    - 标签完全匹配: +30
    - 标签包含: +15
    - 描述包含: +10
    - 作者名包含: +10
    - 点赞加权: likes/1000 (max +20)
    """
    score = 0.0
    kw = keyword.lower().strip()
    title = note.get("title", "").lower()
    desc = note.get("description", "").lower()
    author = note.get("author", "").lower()
    tags = note.get("tags", "").lower()

    # 标题匹配
    if kw == title:
        score += 100
    elif kw in title:
        score += 50
    else:
        # 字符级模糊匹配
        chars = set(kw)
        title_chars = set(title)
        if chars and len(chars & title_chars) / len(chars) > 0.6:
            score += 20

    # 标签匹配
    if tags:
        tag_list = [t.strip() for t in tags.replace("#", " ").split() if t.strip()]
        for tag in tag_list:
            tag_lower = tag.lower()
            if kw == tag_lower:
                score += 30
            elif kw in tag_lower or tag_lower in kw:
                score += 15
            else:
                for ch in kw:
                    if ch in tag_lower:
                        score += 1

    # 描述匹配
    if kw in desc:
        score += 10

    # 作者匹配
    if kw in author:
        score += 10

    # 点赞加权
    likes = _parse_number(note.get("likes", "0"))
    score += min(likes / 1000, 20)

    return score


# ---- 实时 URL 抓取 ----

async def fetch_note_by_url(url: str) -> Optional[dict]:
    """通过 XHS-Downloader API 实时获取笔记详情"""
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.post(
                f"{XHS_API_BASE}/xhs/detail",
                json={"url": url, "download": False},
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("data"):
                    d = data["data"]
                    return {
                        "id": d.get("作品ID", ""),
                        "title": d.get("作品标题", ""),
                        "description": d.get("作品描述", "")[:300],
                        "type": d.get("作品类型", ""),
                        "author": d.get("作者昵称", ""),
                        "author_id": d.get("作者ID", ""),
                        "likes": str(d.get("点赞数量", "0")),
                        "comments": str(d.get("评论数量", "0")),
                        "favorites": str(d.get("收藏数量", "0")),
                        "shares": str(d.get("分享数量", "0")),
                        "publish_time": str(d.get("发布时间", "")),
                        "url": d.get("作品链接", url),
                        "tags": d.get("作品标签", ""),
                        "source": "realtime",
                    }
        except Exception as e:
            print(f"[WARN] 实时获取笔记失败: {e}")
    return None


# ---- 主搜索函数 ----

async def search_xhs_notes(keyword: str, max_results: int = 20) -> list[dict]:
    """
    统一搜索入口

    - 如果输入是小红书链接 → 实时抓取详情
    - 如果输入是关键词 → 从本地索引搜索
    """
    keyword = keyword.strip()
    if not keyword:
        return []

    # 检测是否为 URL
    if _is_xhs_url(keyword):
        result = await fetch_note_by_url(keyword)
        if result:
            return [result]
        # URL 抓取失败，尝试从本地找
        notes = _search_index or _build_search_index()
        url_id = keyword.split("/explore/")[-1].split("/item/")[-1].split("?")[0]
        for note in notes:
            if url_id in note.get("url", "") or url_id == note.get("id", ""):
                return [note]
        return []

    # 关键词搜索
    notes = _search_index or _build_search_index()
    kw_lower = keyword.lower()

    scored = []
    for note in notes:
        score = _calculate_relevance(note, keyword)
        if score > 0:
            scored.append((score, note))

    scored.sort(key=lambda x: x[0], reverse=True)
    results = [note for _, note in scored[:max_results]]

    # 无匹配 → 返回热门内容
    if not results:
        results = sorted(
            notes,
            key=lambda n: _parse_number(n.get("likes", "0")),
            reverse=True,
        )[:max_results]

    return results


async def get_note_detail(url: str) -> Optional[dict]:
    """获取单个帖子的详细信息（实时抓取）"""
    return await fetch_note_by_url(url)


async def search_by_user_profile(url: str) -> list[dict]:
    """通过用户主页链接搜索该用户的所有作品"""
    # 先从本地索引中匹配 author_id
    notes = _search_index or _build_search_index()
    match = USER_PROFILE_PATTERN.search(url)
    if not match:
        return []

    user_id = match.group(1)
    user_notes = [
        n for n in notes
        if user_id in n.get("author_id", "") or user_id in n.get("url", "")
    ]

    if user_notes:
        user_notes.sort(
            key=lambda n: _parse_number(n.get("likes", "0")),
            reverse=True,
        )
        return user_notes

    # 本地无数据 → 尝试实时抓取
    result = await fetch_note_by_url(url)
    return [result] if result else []


def get_search_stats() -> dict:
    """获取搜索引擎状态"""
    notes = _search_index or _build_search_index()
    sources = {}
    for n in notes:
        src = n.get("source", "unknown")
        sources[src] = sources.get(src, 0) + 1

    return {
        "total_notes": len(notes),
        "sources": sources,
        "xhs_api_running": _check_api_health(),
    }


def _check_api_health() -> bool:
    """检查 XHS-Downloader API 是否可用"""
    import urllib.request
    try:
        req = urllib.request.Request(f"{XHS_API_BASE}/", method="GET")
        urllib.request.urlopen(req, timeout=3)
        return True
    except Exception:
        return False
