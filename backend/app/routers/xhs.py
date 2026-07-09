"""小红书数据 API 路由"""

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.services.xhs_parser import read_xhs_notes, compute_xhs_stats
from app.services.xhs_search import (
    search_xhs_notes,
    get_note_detail,
    search_by_user_profile,
    get_search_stats,
    invalidate_cache,
    hot_search_via_gateway,
    hot_search_via_browser,
    search_suggest_via_gateway,
    save_keyword_snapshot,
    get_keyword_trend,
    get_all_keyword_snapshots,
    get_user_posted,
    get_user_info,
    get_note_feed,
)

router = APIRouter()


@router.get("/stats")
async def xhs_stats():
    """获取小红书数据汇总统计"""
    notes = read_xhs_notes()
    stats = compute_xhs_stats(notes)
    return stats.model_dump()


@router.get("/notes")
async def xhs_notes(
    limit: int = Query(20, ge=1, le=100, description="返回数量"),
    sort_by: str = Query("engagement", description="排序字段: engagement / liked / time"),
):
    """获取小红书作品列表"""
    notes = read_xhs_notes()

    if sort_by == "liked":
        notes.sort(key=lambda n: n.liked_count, reverse=True)
    elif sort_by == "time":
        notes.sort(key=lambda n: n.publish_time, reverse=True)
    else:
        notes.sort(key=lambda n: n.engagement, reverse=True)

    result = notes[:limit]
    return {
        "total": len(notes),
        "notes": [n.model_dump() for n in result],
    }


@router.get("/sync")
async def xhs_sync():
    """同步小红书数据（从 XHS-Downloader 数据库重新读取）"""
    invalidate_cache()  # 清除搜索缓存
    notes = read_xhs_notes()
    stats = compute_xhs_stats(notes)
    return {
        "message": "同步完成",
        "total_notes": len(notes),
        "stats": stats.model_dump(),
    }


@router.get("/search-engine")
async def xhs_search_engine_stats():
    """获取搜索引擎状态（数据量、数据源、API 状态）"""
    return get_search_stats()


class SearchRequest(BaseModel):
    keyword: str
    max_results: int = 9999
    realtime_only: bool = False


class NoteDetailRequest(BaseModel):
    url: str


class UserProfileRequest(BaseModel):
    url: str


@router.post("/search")
async def xhs_search(request: SearchRequest):
    """搜索小红书帖子（关键词 or 链接，自动识别），自动保存快照用于趋势分析"""
    results = await search_xhs_notes(request.keyword, request.max_results, request.realtime_only)
    # 自动保存快照
    snapshot = save_keyword_snapshot(request.keyword, results) if results else None
    return {
        "keyword": request.keyword,
        "total": len(results),
        "realtime_only": request.realtime_only,
        "notes": results,
        "snapshot": snapshot,
    }


@router.get("/keyword-trend")
async def xhs_keyword_trend(keyword: str = Query(..., description="关键词")):
    """获取关键词趋势数据（对比历史快照）"""
    return get_keyword_trend(keyword)


@router.get("/keyword-snapshots")
async def xhs_keyword_snapshots():
    """获取所有关键词的快照列表"""
    return get_all_keyword_snapshots()


@router.post("/note-detail")
async def xhs_note_detail(request: NoteDetailRequest):
    """获取单个帖子的详细信息（实时抓取）"""
    detail = await get_note_detail(request.url)
    if detail:
        return {"success": True, "data": detail}
    return {"success": False, "data": None, "message": "获取详情失败"}


@router.post("/user-profile")
async def xhs_user_profile(request: UserProfileRequest):
    """通过用户主页链接搜索该用户的所有作品"""
    results = await search_by_user_profile(request.url)
    return {
        "url": request.url,
        "total": len(results),
        "notes": results,
    }


@router.get("/hot-search")
async def xhs_hot_search():
    """获取小红书热门搜索词（实时）"""
    # 优先浏览器搜索服务
    data = await hot_search_via_browser()
    if data and data.get("success"):
        return data
    # 回退 Gateway
    data = await hot_search_via_gateway()
    if data:
        return data
    return {"success": False, "error": "搜索服务不可用", "hot_list": []}


@router.get("/search-suggest")
async def xhs_search_suggest(keyword: str = Query(..., description="搜索关键词")):
    """获取搜索建议（实时）"""
    data = await search_suggest_via_gateway(keyword)
    if data:
        return data
    return {"success": False, "error": "Gateway 不可用", "suggestions": []}


@router.get("/user-posted")
async def xhs_user_posted(
    user_id: str = Query(..., description="用户 ID"),
    cursor: str = Query("", description="分页游标"),
    num: int = Query(30, description="数量"),
):
    """获取用户发布的笔记列表（实时）"""
    data = await get_user_posted(user_id, cursor, num)
    if data:
        return data
    return {"success": False, "error": "Gateway 不可用", "notes": []}


@router.get("/user-info")
async def xhs_user_info(user_id: str = Query(..., description="用户 ID")):
    """获取用户基本信息（实时）"""
    data = await get_user_info(user_id)
    if data:
        return data
    return {"success": False, "error": "Gateway 不可用"}


@router.get("/note-feed")
async def xhs_note_feed(
    note_id: str = Query(..., description="笔记 ID"),
    xsec_token: str = Query("", description="xsec token"),
):
    """获取单篇笔记详情（实时 feed API）"""
    data = await get_note_feed(note_id, xsec_token)
    if data:
        return data
    return {"success": False, "error": "Gateway 不可用", "note": None}
