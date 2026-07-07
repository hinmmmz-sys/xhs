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
    max_results: int = 20


class NoteDetailRequest(BaseModel):
    url: str


class UserProfileRequest(BaseModel):
    url: str


@router.post("/search")
async def xhs_search(request: SearchRequest):
    """搜索小红书帖子（关键词 or 链接，自动识别）"""
    results = await search_xhs_notes(request.keyword, request.max_results)
    return {
        "keyword": request.keyword,
        "total": len(results),
        "notes": results,
    }


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
