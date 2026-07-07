"""设置 API — 获取和更新配置"""

from fastapi import APIRouter

from app.config import get_settings, update_settings
from app.schemas import SettingsResponse, SettingsUpdate

router = APIRouter()


@router.get("")
async def get_current_settings():
    """获取当前配置（脱敏）"""
    settings = get_settings()
    return SettingsResponse(
        has_minimax=settings.has_minimax,
        minimax_model=settings.minimax_model,
        has_smtp=settings.has_smtp,
        smtp_host=settings.smtp_host,
        smtp_port=settings.smtp_port,
        email_from=settings.email_from,
        email_to=settings.email_to,
        inventory_low_stock_days=settings.inventory_low_stock_days,
        ad_waste_min_spend=settings.ad_waste_min_spend,
        keyword_low_conv_min_clicks=settings.keyword_low_conv_min_clicks,
        conversion_drop_threshold=settings.conversion_drop_threshold,
        negative_review_max_rating=settings.negative_review_max_rating,
    ).model_dump()


@router.put("")
async def update_current_settings(settings: SettingsUpdate):
    """更新配置"""
    # 只更新非 None 的字段
    updates = {k: v for k, v in settings.model_dump().items() if v is not None}
    if not updates:
        return {"message": "无更新内容"}

    new_settings = update_settings(updates)
    return {
        "message": "配置已更新",
        "updated_fields": list(updates.keys()),
        "has_minimax": new_settings.has_minimax,
        "has_smtp": new_settings.has_smtp,
    }
