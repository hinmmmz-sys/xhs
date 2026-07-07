"""经营概览 API"""

from fastapi import APIRouter, Query

from app.services.business_overview import get_business_overview

router = APIRouter()


@router.get("/")
async def overview(date_range: str = Query("7d", description="日期周期: realtime, 1d, 7d, 30d")):
    """获取经营概览数据"""
    data = get_business_overview(date_range)
    return data.model_dump()


@router.get("/date-ranges")
async def date_ranges():
    """获取可选的日期周期列表"""
    from app.services.business_overview import DATE_RANGES
    return {
        "ranges": [
            {"value": k, "label": v["label"]}
            for k, v in DATE_RANGES.items()
        ]
    }
