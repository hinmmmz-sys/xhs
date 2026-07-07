"""模拟数据生成器 — 生成亚马逊卖家后台风格的 CSV 文件"""

import csv
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional


MOCK_DIR = Path(__file__).parent / "mock"


def _date_str(days_ago: int = 0) -> str:
    return (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")


def generate_advertising_report(filepath: Path) -> None:
    """生成广告报告 CSV，包含异常数据（高花费0订单、高点击无转化）"""
    rows = [
        # 正常数据
        {"date": _date_str(1), "campaign_name": "Campaign-A", "campaign_id": "CMP-001",
         "keyword": "kitchen organizer", "match_type": "Broad", "impressions": 3200,
         "clicks": 85, "spend": 42.50, "sales": 186.20, "orders": 6, "acos": 22.8},
        # 异常：高花费 0 订单
        {"date": _date_str(1), "campaign_name": "Campaign-B", "campaign_id": "CMP-002",
         "keyword": "desk accessories", "match_type": "Broad", "impressions": 1800,
         "clicks": 47, "spend": 37.50, "sales": 0.0, "orders": 0, "acos": 0.0},
        # 异常：高点击无转化
        {"date": _date_str(1), "campaign_name": "Campaign-C", "campaign_id": "CMP-003",
         "keyword": "wireless organizer", "match_type": "Exact", "impressions": 5600,
         "clicks": 42, "spend": 28.00, "sales": 0.0, "orders": 0, "acos": 0.0},
        # 正常数据
        {"date": _date_str(1), "campaign_name": "Campaign-D", "campaign_id": "CMP-004",
         "keyword": "cable management", "match_type": "Phrase", "impressions": 2100,
         "clicks": 53, "spend": 21.00, "sales": 95.40, "orders": 4, "acos": 22.0},
        {"date": _date_str(1), "campaign_name": "Campaign-E", "campaign_id": "CMP-005",
         "keyword": "office supplies", "match_type": "Broad", "impressions": 8900,
         "clicks": 120, "spend": 56.00, "sales": 312.80, "orders": 11, "acos": 17.9},
        # 正常数据
        {"date": _date_str(1), "campaign_name": "Campaign-A", "campaign_id": "CMP-001",
         "keyword": "kitchen rack", "match_type": "Phrase", "impressions": 1500,
         "clicks": 32, "spend": 16.00, "sales": 68.00, "orders": 3, "acos": 23.5},
        # 异常：中等花费低转化
        {"date": _date_str(1), "campaign_name": "Campaign-F", "campaign_id": "CMP-006",
         "keyword": "storage box", "match_type": "Broad", "impressions": 3400,
         "clicks": 65, "spend": 15.50, "sales": 12.00, "orders": 1, "acos": 129.2},
    ]

    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "date", "campaign_name", "campaign_id", "keyword", "match_type",
            "impressions", "clicks", "spend", "sales", "orders", "acos"
        ])
        writer.writeheader()
        writer.writerows(rows)


def generate_inventory_report(filepath: Path) -> None:
    """生成库存报告 CSV，包含异常（库存仅够 8 天）"""
    rows = [
        # 异常：库存仅够 8 天
        {"sku": "SKU-A", "product_name": "Desktop Organizer Pro",
         "fba_in_stock": 120, "daily_sales_avg": 15.0, "days_of_supply": 8.0,
         "inbound_qty": 0, "status": "active"},
        # 正常
        {"sku": "SKU-B", "product_name": "Cable Management Box",
         "fba_in_stock": 850, "daily_sales_avg": 12.0, "days_of_supply": 70.8,
         "inbound_qty": 200, "status": "active"},
        # 正常
        {"sku": "SKU-C", "product_name": "Wireless Phone Charger Stand",
         "fba_in_stock": 430, "daily_sales_avg": 8.5, "days_of_supply": 50.6,
         "inbound_qty": 100, "status": "active"},
        # 异常：库存仅够 12 天
        {"sku": "SKU-D", "product_name": "Monitor Stand Riser",
         "fba_in_stock": 96, "daily_sales_avg": 8.0, "days_of_supply": 12.0,
         "inbound_qty": 0, "status": "active"},
        # 正常
        {"sku": "SKU-E", "product_name": "Adjustable Laptop Stand",
         "fba_in_stock": 620, "daily_sales_avg": 10.0, "days_of_supply": 62.0,
         "inbound_qty": 150, "status": "active"},
        # 正常
        {"sku": "SKU-F", "product_name": "Desk Lamp LED",
         "fba_in_stock": 380, "daily_sales_avg": 6.0, "days_of_supply": 63.3,
         "inbound_qty": 80, "status": "active"},
    ]

    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "sku", "product_name", "fba_in_stock", "daily_sales_avg",
            "days_of_supply", "inbound_qty", "status"
        ])
        writer.writeheader()
        writer.writerows(rows)


def generate_review_report(filepath: Path) -> None:
    """生成评论报告 CSV，包含异常（2星差评，包装破损）"""
    rows = [
        # 异常：2星差评，包装破损
        {"sku": "SKU-C", "product_name": "Wireless Phone Charger Stand",
         "review_id": "R100001", "rating": 2,
         "title": "Product arrived damaged",
         "body": "The packaging was completely broken when I received it. The product itself seems okay but the box was torn and the stand was scratched. Very disappointed with the packaging quality.",
         "date": _date_str(1), "verified_purchase": True},
        # 异常：1星差评
        {"sku": "SKU-C", "product_name": "Wireless Phone Charger Stand",
         "review_id": "R100002", "rating": 1,
         "title": "Stopped working after 2 days",
         "body": "Charger worked fine for the first two days then completely died. Not worth the money.",
         "date": _date_str(2), "verified_purchase": True},
        # 正常：5星好评
        {"sku": "SKU-A", "product_name": "Desktop Organizer Pro",
         "review_id": "R100003", "rating": 5,
         "title": "Great organizer!",
         "body": "Perfect for my desk. Keeps everything tidy and looks great.",
         "date": _date_str(1), "verified_purchase": True},
        # 正常：4星
        {"sku": "SKU-B", "product_name": "Cable Management Box",
         "review_id": "R100004", "rating": 4,
         "title": "Good but slightly small",
         "body": "Works well for cable management but wish it was a bit larger.",
         "date": _date_str(1), "verified_purchase": True},
        # 异常：2星差评，质量一般
        {"sku": "SKU-D", "product_name": "Monitor Stand Riser",
         "review_id": "R100005", "rating": 2,
         "title": "Flimsy and wobbly",
         "body": "The stand is not sturdy at all. My monitor wobbles every time I type. Would not recommend.",
         "date": _date_str(2), "verified_purchase": True},
    ]

    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "sku", "product_name", "review_id", "rating", "title", "body",
            "date", "verified_purchase"
        ])
        writer.writeheader()
        writer.writerows(rows)


def generate_sales_report(filepath: Path) -> None:
    """生成销量报告 CSV，包含异常（转化率下降 35%）"""
    rows = [
        # 正常
        {"date": _date_str(1), "sku": "SKU-A", "product_name": "Desktop Organizer Pro",
         "units": 15, "sessions": 320, "conversions": 15, "conversion_rate": 4.69,
         "cr_7d_avg": 4.80, "cr_change_pct": -2.3, "buy_box_price": 29.99},
        # 正常
        {"date": _date_str(1), "sku": "SKU-B", "product_name": "Cable Management Box",
         "units": 12, "sessions": 280, "conversions": 12, "conversion_rate": 4.29,
         "cr_7d_avg": 4.10, "cr_change_pct": 4.6, "buy_box_price": 19.99},
        # 正常
        {"date": _date_str(1), "sku": "SKU-C", "product_name": "Wireless Phone Charger Stand",
         "units": 8, "sessions": 190, "conversions": 8, "conversion_rate": 4.21,
         "cr_7d_avg": 4.35, "cr_change_pct": -3.2, "buy_box_price": 24.99},
        # 异常：转化率下降 35%
        {"date": _date_str(1), "sku": "SKU-D", "product_name": "Monitor Stand Riser",
         "units": 5, "sessions": 250, "conversions": 5, "conversion_rate": 2.00,
         "cr_7d_avg": 3.08, "cr_change_pct": -35.1, "buy_box_price": 34.99},
        # 正常
        {"date": _date_str(1), "sku": "SKU-E", "product_name": "Adjustable Laptop Stand",
         "units": 10, "sessions": 230, "conversions": 10, "conversion_rate": 4.35,
         "cr_7d_avg": 4.20, "cr_change_pct": 3.6, "buy_box_price": 27.99},
        # 异常：转化率下降 28%
        {"date": _date_str(1), "sku": "SKU-F", "product_name": "Desk Lamp LED",
         "units": 4, "sessions": 180, "conversions": 4, "conversion_rate": 2.22,
         "cr_7d_avg": 3.09, "cr_change_pct": -28.2, "buy_box_price": 22.99},
    ]

    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "date", "sku", "product_name", "units", "sessions", "conversions",
            "conversion_rate", "cr_7d_avg", "cr_change_pct", "buy_box_price"
        ])
        writer.writeheader()
        writer.writerows(rows)


def generate_all(output_dir: Optional[Path] = None) -> "dict[str, str]":
    """生成全部 4 个模拟 CSV 文件"""
    out = output_dir or MOCK_DIR
    out.mkdir(parents=True, exist_ok=True)

    files = {
        "advertising_report.csv": generate_advertising_report,
        "inventory_report.csv": generate_inventory_report,
        "review_report.csv": generate_review_report,
        "sales_report.csv": generate_sales_report,
    }

    generated = {}
    for filename, gen_func in files.items():
        filepath = out / filename
        gen_func(filepath)
        generated[filename] = str(filepath)
        print(f"  [OK] {filename}")

    return generated


if __name__ == "__main__":
    print("正在生成模拟数据...")
    result = generate_all()
    print(f"\n完成！共生成 {len(result)} 个文件：")
    for name, path in result.items():
        print(f"  {name} -> {path}")
