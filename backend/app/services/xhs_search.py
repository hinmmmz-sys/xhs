"""小红书搜索服务 — 统一搜索引擎

数据源：
1. XHS API Gateway (port 5557) — 实时关键词搜索（优先）
2. ExploreData.db — XHS-Downloader 采集的真实笔记（49条）
3. xhs_notes_db.json — 预置搜索数据库（176条）
4. XHS-Downloader API — 实时 URL 抓取（port 5556）
"""

import json
import re
import sqlite3
from pathlib import Path
from datetime import datetime
from typing import Optional

import httpx

from app.config import get_settings

XHS_API_BASE = "http://127.0.0.1:5556"       # XHS-Downloader（URL 抓取）
XHS_GATEWAY_BASE = "http://127.0.0.1:5557"    # XHS API Gateway（实时搜索）
XHS_BROWSER_BASE = "http://127.0.0.1:5558"    # Browser Search Service（CDP 浏览器实时搜索）

# 小红书链接正则
XHS_URL_PATTERN = re.compile(
    r"(?:https?://)?(?:www\.)?(?:xiaohongshu\.com|rednote\.com)"
    r"(?:/explore/|/discovery/item/|/user/profile/)\S+"
)
XHS_SHORT_PATTERN = re.compile(r"(?:https?://)?xhslink\.com/\S+")
USER_PROFILE_PATTERN = re.compile(
    r"(?:https?://)?(?:www\.)?(?:xiaohongshu\.com|rednote\.com)/user/profile/([a-z0-9]+)"
)

# 关键词快照存储路径
KEYWORD_SNAPSHOTS_PATH = Path(__file__).parent.parent / "data" / "keyword_snapshots.json"

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


# ---- Gateway 实时搜索 ----

async def search_via_browser(keyword: str, max_results: int = 9999) -> Optional[dict]:
    """通过 CDP 浏览器搜索服务实时搜索小红书笔记"""
    async with httpx.AsyncClient(timeout=300) as client:
        try:
            resp = await client.post(
                f"{XHS_BROWSER_BASE}/search",
                params={"keyword": keyword, "max_results": max_results},
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("success") and data.get("notes"):
                    return data
        except Exception as e:
            print(f"[WARN] Browser 搜索失败: {e}")
    return None


async def hot_search_via_browser() -> Optional[dict]:
    """通过浏览器搜索服务获取热门搜索"""
    async with httpx.AsyncClient(timeout=20) as client:
        try:
            resp = await client.get(f"{XHS_BROWSER_BASE}/hot-search")
            if resp.status_code == 200:
                data = resp.json()
                if data.get("success"):
                    return data
        except Exception as e:
            print(f"[WARN] Browser 热门搜索失败: {e}")
    return None


def _normalize_browser_note(note: dict) -> dict:
    """将浏览器搜索返回的笔记格式统一为本地索引格式"""
    return {
        "id": note.get("id", ""),
        "title": note.get("title", ""),
        "description": "",
        "type": note.get("type", "图文"),
        "author": note.get("author", ""),
        "author_id": note.get("author_id", ""),
        "likes": note.get("likes", "0"),
        "comments": note.get("comments", "0"),
        "favorites": note.get("favorites", "0"),
        "shares": note.get("shares", "0"),
        "publish_time": note.get("publish_time", ""),
        "url": note.get("url", ""),
        "tags": "",
        "cover_url": note.get("cover_url", ""),
        "source": "browser_live",
    }


async def search_via_gateway(keyword: str, sort: str = "general", page: int = 1, note_type: int = 0) -> Optional[dict]:
    """通过 XHS API Gateway 搜索小红书笔记（单页）"""
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            resp = await client.post(
                f"{XHS_GATEWAY_BASE}/search",
                params={"keyword": keyword, "sort": sort, "page": page, "note_type": note_type},
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("success"):
                    return data
        except Exception as e:
            print(f"[WARN] Gateway 搜索失败: {e}")
    return None


async def search_via_gateway_full(keyword: str, max_results: int = 9999) -> Optional[dict]:
    """通过 Gateway 多页搜索获取全部结果"""
    all_notes = []
    max_pages = 50  # 安全上限

    async with httpx.AsyncClient(timeout=15) as client:
        for p in range(1, max_pages + 1):
            try:
                resp = await client.post(
                    f"{XHS_GATEWAY_BASE}/search",
                    params={"keyword": keyword, "sort": "general", "page": p, "note_type": 0},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("success") and data.get("notes"):
                        all_notes.extend(data["notes"])
                        if not data.get("has_more", False):
                            break
                        if len(all_notes) >= max_results:
                            break
                    else:
                        break
                else:
                    break
            except Exception as e:
                print(f"[WARN] Gateway 第{p}页搜索失败: {e}")
                break

    if all_notes:
        return {"success": True, "notes": all_notes[:max_results], "total": len(all_notes[:max_results])}
    return None


async def hot_search_via_gateway() -> Optional[dict]:
    """通过 Gateway 获取热门搜索词"""
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(f"{XHS_GATEWAY_BASE}/hot_search")
            if resp.status_code == 200:
                data = resp.json()
                if data.get("success"):
                    return data
        except Exception as e:
            print(f"[WARN] Gateway 热门搜索失败: {e}")
    return None


async def search_suggest_via_gateway(keyword: str) -> Optional[dict]:
    """通过 Gateway 获取搜索建议"""
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(
                f"{XHS_GATEWAY_BASE}/search_suggest",
                params={"keyword": keyword},
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("success"):
                    return data
        except Exception as e:
            print(f"[WARN] Gateway 搜索建议失败: {e}")
    return None


def _normalize_gateway_note(note: dict) -> dict:
    """将 Gateway 返回的笔记格式统一为本地索引格式"""
    return {
        "id": note.get("note_id", ""),
        "title": note.get("title", ""),
        "description": note.get("desc", ""),
        "type": note.get("type", ""),
        "author": note.get("author_nickname", ""),
        "author_id": note.get("author_id", ""),
        "likes": note.get("liked_count", "0"),
        "comments": note.get("comment_count", "0"),
        "favorites": note.get("collected_count", "0"),
        "shares": note.get("shared_count", "0"),
        "publish_time": "",
        "url": note.get("url", ""),
        "tags": "",
        "cover_url": note.get("cover_url", ""),
        "source": "gateway_live",
    }


# ---- 主搜索函数 ----

async def search_xhs_notes(keyword: str, max_results: int = 9999, realtime_only: bool = False) -> list[dict]:
    """
    统一搜索入口

    - 如果输入是小红书链接 → 实时抓取详情
    - 如果输入是关键词 → 优先走 Gateway 多页搜索，其次浏览器
    - realtime_only=True 时禁用本地索引兜底
    """
    keyword = keyword.strip()
    if not keyword:
        return []

    # 检测是否为 URL
    if _is_xhs_url(keyword):
        result = await fetch_note_by_url(keyword)
        if result:
            return [result]
        if realtime_only:
            return []
        # URL 抓取失败，尝试从本地找
        notes = _search_index or _build_search_index()
        url_id = keyword.split("/explore/")[-1].split("/item/")[-1].split("?")[0]
        for note in notes:
            if url_id in note.get("url", "") or url_id == note.get("id", ""):
                return [note]
        return []

    # 关键词搜索 — 优先 Gateway 多页搜索（不依赖浏览器）
    gw_result = await search_via_gateway_full(keyword, max_results)
    if gw_result and gw_result.get("notes"):
        notes = [_normalize_gateway_note(n) for n in gw_result["notes"]]
        return notes[:max_results]

    # Gateway 不可用 → 尝试浏览器搜索
    browser_result = await search_via_browser(keyword, max_results)
    if browser_result and browser_result.get("notes"):
        notes = [_normalize_browser_note(n) for n in browser_result["notes"]]
        return notes[:max_results]

    if realtime_only:
        return []

    # 均不可用 → 回退本地索引
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
    notes = _search_index or _build_search_index()
    match = USER_PROFILE_PATTERN.search(url)
    if not match:
        return []

    user_id = match.group(1)

    # 优先走 Gateway 实时获取
    gw_data = await get_user_posted(user_id)
    if gw_data and gw_data.get("notes"):
        results = []
        for n in gw_data["notes"]:
            results.append(_normalize_gateway_note(n) | {"source": "user_live"})
        return results

    # Gateway 不可用 → 本地索引回退
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
        "gateway_running": _check_gateway_health(),
        "browser_search_running": _check_browser_health(),
        "browser_logged_in": _check_browser_login(),
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


def _check_gateway_health() -> bool:
    """检查 XHS API Gateway 是否可用"""
    import urllib.request
    try:
        req = urllib.request.Request(f"{XHS_GATEWAY_BASE}/health", method="GET")
        resp = urllib.request.urlopen(req, timeout=3)
        data = json.loads(resp.read())
        return data.get("status") == "ok"
    except Exception:
        return False


async def get_user_posted(user_id: str, cursor: str = "", num: int = 30) -> Optional[dict]:
    """通过 Gateway 获取用户发布的笔记列表"""
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            resp = await client.get(
                f"{XHS_GATEWAY_BASE}/user_posted",
                params={"user_id": user_id, "cursor": cursor, "num": num},
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("success"):
                    return data
        except Exception as e:
            print(f"[WARN] Gateway user_posted 失败: {e}")
    return None


async def get_user_info(user_id: str) -> Optional[dict]:
    """通过 Gateway 获取用户基本信息"""
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(
                f"{XHS_GATEWAY_BASE}/user_info",
                params={"user_id": user_id},
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("success"):
                    return data
        except Exception as e:
            print(f"[WARN] Gateway user_info 失败: {e}")
    return None


async def get_note_feed(note_id: str, xsec_token: str = "") -> Optional[dict]:
    """通过 Gateway 获取单篇笔记详情 (feed API)"""
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            resp = await client.get(
                f"{XHS_GATEWAY_BASE}/feed",
                params={"note_id": note_id, "xsec_token": xsec_token},
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("success"):
                    return data
        except Exception as e:
            print(f"[WARN] Gateway feed 失败: {e}")
    return None


def _check_browser_health() -> bool:
    """检查浏览器搜索服务是否可用"""
    import urllib.request
    try:
        req = urllib.request.Request(f"{XHS_BROWSER_BASE}/health", method="GET")
        resp = urllib.request.urlopen(req, timeout=5)
        data = json.loads(resp.read())
        return data.get("status") == "ok" and data.get("browser_connected", False)
    except Exception:
        return False


def _check_browser_login() -> bool:
    """检查浏览器搜索服务连接的小红书页面是否已登录"""
    import urllib.request
    try:
        req = urllib.request.Request(f"{XHS_BROWSER_BASE}/login-status", method="GET")
        resp = urllib.request.urlopen(req, timeout=5)
        data = json.loads(resp.read())
        return data.get("loggedIn", False)
    except Exception:
        return False


# ========================================
# 关键词趋势分析
# ========================================

def _load_snapshots() -> dict:
    """加载关键词快照数据"""
    if KEYWORD_SNAPSHOTS_PATH.exists():
        try:
            with open(KEYWORD_SNAPSHOTS_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def _save_snapshots(data: dict):
    """保存关键词快照数据"""
    KEYWORD_SNAPSHOTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(KEYWORD_SNAPSHOTS_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def save_keyword_snapshot(keyword: str, notes: list[dict]) -> dict:
    """保存搜索快照用于趋势分析"""
    snapshots = _load_snapshots()
    kw = keyword.strip()
    if kw not in snapshots:
        snapshots[kw] = []

    # 计算汇总指标
    total_likes = sum(_parse_number(n.get("likes", "0")) for n in notes)
    total_comments = sum(_parse_number(n.get("comments", "0")) for n in notes)
    total_shares = sum(_parse_number(n.get("shares", "0")) for n in notes)
    total_collects = sum(_parse_number(n.get("favorites", "0")) for n in notes)
    total_engagement = total_likes + total_comments + total_shares + total_collects

    # 作者聚合
    author_map: dict[str, int] = {}
    for n in notes:
        author = n.get("author", "")
        if author:
            author_map[author] = author_map.get(author, 0) + 1

    # 类型统计
    video_count = sum(1 for n in notes if n.get("type", "") == "视频")
    image_count = sum(1 for n in notes if n.get("type", "") == "图文")
    gallery_count = sum(1 for n in notes if n.get("type", "") == "图集")

    snapshot = {
        "timestamp": datetime.now().isoformat(),
        "date": datetime.now().strftime("%Y-%m-%d"),
        "time": datetime.now().strftime("%H:%M"),
        "total_notes": len(notes),
        "total_likes": total_likes,
        "total_comments": total_comments,
        "total_shares": total_shares,
        "total_collects": total_collects,
        "total_engagement": total_engagement,
        "avg_engagement": round(total_engagement / max(len(notes), 1)),
        "video_count": video_count,
        "image_count": image_count,
        "gallery_count": gallery_count,
        "unique_authors": len(author_map),
    }

    snapshots[kw].append(snapshot)
    # 保留最近 100 条快照
    snapshots[kw] = snapshots[kw][-100:]

    _save_snapshots(snapshots)
    print(f"[INFO] 关键词快照已保存: \"{kw}\" → {len(notes)} 条, 互动 {total_engagement}")
    return snapshot


def get_keyword_trend(keyword: str) -> dict:
    """获取关键词趋势数据"""
    snapshots = _load_snapshots()
    kw = keyword.strip()
    history = snapshots.get(kw, [])

    if not history:
        return {
            "keyword": kw,
            "snapshots": [],
            "has_data": False,
        }

    latest = history[-1]

    # 查找上一个不同日期的快照
    prev = None
    for s in reversed(history[:-1]):
        if s.get("date") != latest.get("date"):
            prev = s
            break
    # 如果没有不同日期的，用上一条
    if not prev and len(history) >= 2:
        prev = history[-2]

    result = {
        "keyword": kw,
        "has_data": True,
        "snapshot_count": len(history),
        "latest": latest,
        "previous": prev,
        "history": history[-10:],  # 最近10条用于趋势图
    }

    if prev:
        eng_change = latest["total_engagement"] - prev["total_engagement"]
        eng_pct = (eng_change / max(prev["total_engagement"], 1)) * 100
        notes_change = latest["total_notes"] - prev["total_notes"]
        likes_change = latest["total_likes"] - prev["total_likes"]
        comments_change = latest["total_comments"] - prev["total_comments"]
        authors_change = latest.get("unique_authors", 0) - prev.get("unique_authors", 0)

        result.update({
            "engagement_change": eng_change,
            "engagement_change_pct": round(eng_pct, 1),
            "notes_change": notes_change,
            "likes_change": likes_change,
            "comments_change": comments_change,
            "authors_change": authors_change,
            "trend": "up" if eng_change > 0 else ("down" if eng_change < 0 else "flat"),
        })
    else:
        result["trend"] = "new"

    return result


def get_all_keyword_snapshots() -> dict:
    """获取所有关键词的快照列表"""
    snapshots = _load_snapshots()
    result = {}
    for kw, history in snapshots.items():
        if history:
            latest = history[-1]
            result[kw] = {
                "snapshot_count": len(history),
                "latest_date": latest.get("date", ""),
                "latest_time": latest.get("time", ""),
                "total_notes": latest.get("total_notes", 0),
                "total_engagement": latest.get("total_engagement", 0),
            }
    return result
