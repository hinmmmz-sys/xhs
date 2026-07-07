"""应用配置管理"""

import json
from pathlib import Path
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings


# 运行时配置文件路径（可被 API 动态修改）
RUNTIME_CONFIG_FILE = Path(__file__).parent / "data" / "runtime_config.json"


class Settings(BaseSettings):
    """应用配置，从 .env 文件或环境变量读取"""

    # MiniMax (OpenAI 兼容)
    minimax_api_key: str = ""
    minimax_base_url: str = "https://api.minimaxi.com/v1"
    minimax_model: str = "MiniMax-M3"

    # SMTP
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    email_from: str = "sellerpulse@example.com"
    email_to: str = ""

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # 规则引擎阈值
    inventory_low_stock_days: int = 15
    ad_waste_min_spend: float = 10.0
    keyword_low_conv_min_clicks: int = 20
    conversion_drop_threshold: float = -20.0
    negative_review_max_rating: int = 2

    # 路径
    data_dir: str = str(Path(__file__).parent / "data")
    mock_dir: str = str(Path(__file__).parent / "data" / "mock")
    uploads_dir: str = str(Path(__file__).parent / "data" / "uploads")
    reports_dir: str = str(Path(__file__).parent / "data" / "reports")

    # 小红书数据路径 (XHS-Downloader 的 Volume 目录)
    xhs_data_path: str = str(Path.home() / "Desktop" / "XHS-Downloader" / "Volume")

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @property
    def has_minimax(self) -> bool:
        return bool(self.minimax_api_key)

    @property
    def has_smtp(self) -> bool:
        return bool(self.smtp_host and self.smtp_user and self.smtp_password)


# ---- 运行时配置（可被 API 动态修改，覆盖 .env 默认值）----

def load_runtime_overrides() -> dict:
    """从 JSON 文件加载运行时覆盖配置"""
    if RUNTIME_CONFIG_FILE.exists():
        try:
            return json.loads(RUNTIME_CONFIG_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return {}
    return {}


def save_runtime_overrides(overrides: dict) -> None:
    """保存运行时覆盖配置到 JSON 文件"""
    RUNTIME_CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
    RUNTIME_CONFIG_FILE.write_text(
        json.dumps(overrides, indent=2, ensure_ascii=False), encoding="utf-8"
    )


def get_settings() -> Settings:
    """获取当前配置（合并 .env 默认值和运行时覆盖）"""
    base = Settings()
    overrides = load_runtime_overrides()
    if overrides:
        # 用运行时配置覆盖
        for key, value in overrides.items():
            if hasattr(base, key):
                setattr(base, key, value)
    return base


def update_settings(updates: dict) -> Settings:
    """更新运行时配置，返回更新后的 Settings"""
    overrides = load_runtime_overrides()
    overrides.update(updates)
    save_runtime_overrides(overrides)
    return get_settings()
