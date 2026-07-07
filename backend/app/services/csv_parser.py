"""CSV 解析服务 — 读取并标准化各类型 CSV 文件"""

import csv
from pathlib import Path
from typing import Dict, List, Optional, Union

import pandas as pd

from app.schemas import (
    AdvertisingRecord,
    InventoryRecord,
    ReviewRecord,
    SalesRecord,
)


# ---- 文件类型识别 ----

FILE_TYPE_MAP = {
    "advertising": ["advertising", "ad_report", "advertising_report", "campaign"],
    "inventory": ["inventory", "inv_report", "inventory_report", "stock"],
    "review": ["review", "rev_report", "review_report", "reviews"],
    "sales": ["sales", "sale_report", "sales_report", "business"],
}


def detect_file_type(filename: str) -> Optional[str]:
    """根据文件名自动识别 CSV 类型"""
    name_lower = filename.lower()
    for ftype, keywords in FILE_TYPE_MAP.items():
        if any(kw in name_lower for kw in keywords):
            return ftype
    return None


# ---- 各类型解析 ----

def parse_advertising_report(filepath: Union[str, Path]) -> List[AdvertisingRecord]:
    """解析广告报告 CSV"""
    df = pd.read_csv(filepath)
    records = []
    for _, row in df.iterrows():
        records.append(AdvertisingRecord(
            date=str(row.get("date", "")),
            campaign_name=str(row.get("campaign_name", "")),
            campaign_id=str(row.get("campaign_id", "")),
            keyword=str(row.get("keyword", "")),
            match_type=str(row.get("match_type", "")),
            impressions=int(row.get("impressions", 0) or 0),
            clicks=int(row.get("clicks", 0) or 0),
            spend=float(row.get("spend", 0) or 0),
            sales=float(row.get("sales", 0) or 0),
            orders=int(row.get("orders", 0) or 0),
            acos=float(row.get("acos")) if pd.notna(row.get("acos")) else None,
        ))
    return records


def parse_inventory_report(filepath: Union[str, Path]) -> List[InventoryRecord]:
    """解析库存报告 CSV"""
    df = pd.read_csv(filepath)
    records = []
    for _, row in df.iterrows():
        records.append(InventoryRecord(
            sku=str(row.get("sku", "")),
            product_name=str(row.get("product_name", "")),
            fba_in_stock=int(row.get("fba_in_stock", 0) or 0),
            daily_sales_avg=float(row.get("daily_sales_avg", 0) or 0),
            days_of_supply=float(row.get("days_of_supply", 0) or 0),
            inbound_qty=int(row.get("inbound_qty", 0) or 0),
            status=str(row.get("status", "")),
        ))
    return records


def parse_review_report(filepath: Union[str, Path]) -> List[ReviewRecord]:
    """解析评论报告 CSV"""
    df = pd.read_csv(filepath)
    records = []
    for _, row in df.iterrows():
        vp = row.get("verified_purchase", True)
        if isinstance(vp, str):
            vp = vp.lower().strip() in ("true", "1", "yes")
        records.append(ReviewRecord(
            sku=str(row.get("sku", "")),
            product_name=str(row.get("product_name", "")),
            review_id=str(row.get("review_id", "")),
            rating=int(row.get("rating", 5) or 5),
            title=str(row.get("title", "")),
            body=str(row.get("body", "")),
            date=str(row.get("date", "")),
            verified_purchase=bool(vp),
        ))
    return records


def parse_sales_report(filepath: Union[str, Path]) -> List[SalesRecord]:
    """解析销量报告 CSV"""
    df = pd.read_csv(filepath)
    records = []
    for _, row in df.iterrows():
        records.append(SalesRecord(
            date=str(row.get("date", "")),
            sku=str(row.get("sku", "")),
            product_name=str(row.get("product_name", "")),
            units=int(row.get("units", 0) or 0),
            sessions=int(row.get("sessions", 0) or 0),
            conversions=int(row.get("conversions", 0) or 0),
            conversion_rate=float(row.get("conversion_rate", 0) or 0),
            cr_7d_avg=float(row.get("cr_7d_avg", 0) or 0),
            cr_change_pct=float(row.get("cr_change_pct", 0) or 0),
            buy_box_price=float(row.get("buy_box_price", 0) or 0),
        ))
    return records


# ---- 统一解析入口 ----

def parse_all_reports(data_dir: Union[str, Path]) -> Dict:
    """
    扫描目录，自动识别文件类型并解析全部 CSV。
    返回: {"advertising": [...], "inventory": [...], "review": [...], "sales": [...]}
    """
    data_path = Path(data_dir)
    result = {
        "advertising": [],
        "inventory": [],
        "review": [],
        "sales": [],
    }

    if not data_path.exists():
        return result

    for filepath in data_path.glob("*.csv"):
        ftype = detect_file_type(filepath.name)
        if ftype is None:
            continue
        try:
            if ftype == "advertising":
                result["advertising"].extend(parse_advertising_report(filepath))
            elif ftype == "inventory":
                result["inventory"].extend(parse_inventory_report(filepath))
            elif ftype == "review":
                result["review"].extend(parse_review_report(filepath))
            elif ftype == "sales":
                result["sales"].extend(parse_sales_report(filepath))
        except Exception as e:
            print(f"[WARN] 解析 {filepath.name} 失败: {e}")

    return result
