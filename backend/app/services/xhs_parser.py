"""小红书数据解析服务 — 从 XHS-Downloader 的 ExploreData.db 读取采集数据"""

import sqlite3
import random
from pathlib import Path
from typing import List, Optional

from app.config import get_settings
from app.schemas import XHSNoteRecord, XHSStats


# ---- Mock 数据池 ----

_MOCK_TITLES = [
    "无限蓝牙耳机实测｜百元价位天花板？",
    "租房好物分享｜提升幸福感的小物件",
    "运动手环开箱｜续航让我惊艳了",
    "榨汁机测评｜300W真的够用吗？",
    "台灯推荐｜护眼+氛围感一步到位",
    "背包种草｜通勤+露营双重需求满足",
    "防水喷雾实测｜户外人必看",
    "手机支架对比｜重力感应真的好用吗？",
    "保温杯合集｜316不锈钢 vs 304怎么选",
    "无线充电器｜车载场景终于完美了",
    "瑜伽垫推荐｜TPE材质到底好在哪？",
    "百元数码好物清单｜闭眼入不踩雷",
    "居家收纳神器｜小户型救星",
    "平价护肤好物｜学生党也能用得起",
    "厨房小家电盘点｜懒人必备",
]

_MOCK_AUTHORS = [
    ("5f3a2b1c", "数码测评师-Leo"),
    ("6a8c3d2e", "生活美学-小猫"),
    ("7b9d4e3f", "户外探险家-Max"),
    ("8c0e5f4a", "居家好物种草"),
    ("9d1f6a5b", "健身教练Cathy"),
    ("0e2a7b6c", "美妆博主-Lily"),
    ("1f3b8c7d", "数码极客Tom"),
    ("2a4c9d8e", "省钱攻略达人"),
]

_MOCK_TAGS = ["数码好物", "测评", "种草", "平价推荐", "生活好物", "开箱", "租房必备", "通勤"]


def _generate_mock_notes(count: int = 20) -> List[XHSNoteRecord]:
    """生成模拟小红书作品数据（用于无真实数据时展示）"""
    notes = []
    for i in range(count):
        author_id, author_name = random.choice(_MOCK_AUTHORS)
        title = random.choice(_MOCK_TITLES)
        note_type = random.choice(["视频", "图文", "图文", "图集"])

        liked = random.randint(5, 8000)
        comment = int(liked * random.uniform(0.02, 0.15))
        share = int(liked * random.uniform(0.01, 0.08))
        collect = int(liked * random.uniform(0.05, 0.3))

        tags = " ".join(random.sample(_MOCK_TAGS, random.randint(2, 4)))
        note_id = f"xhs_{random.randint(100000000000, 999999999999):x}"

        notes.append(XHSNoteRecord(
            note_id=note_id,
            note_type=note_type,
            title=title,
            desc=f"今天给大家分享{title}，希望对大家有帮助～",
            tags=tags,
            publish_time=f"2026-07-{random.randint(1, 6)} {random.randint(8, 22)}:{random.randint(0, 59):02d}:00",
            collect_time=f"2026-07-06 14:00:00",
            liked_count=liked,
            comment_count=comment,
            share_count=share,
            collect_count=collect,
            author_nickname=author_name,
            author_id=author_id,
            note_url=f"https://www.xiaohongshu.com/explore/{note_id}",
        ))
    return notes


def read_xhs_notes() -> List[XHSNoteRecord]:
    """
    从 XHS-Downloader 的 ExploreData.db 读取采集的作品数据。
    如果数据库不存在或为空，返回空列表（不生成假数据）。
    """
    settings = get_settings()
    db_path = Path(settings.xhs_data_path) / "Download" / "ExploreData.db"

    # 尝试读取真实数据库
    if db_path.exists():
        try:
            conn = sqlite3.connect(str(db_path))
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM explore_data")
            rows = cursor.fetchall()

            if rows:
                notes = []
                for row in rows:
                    notes.append(XHSNoteRecord(
                        note_id=str(row["作品ID"]) if row["作品ID"] else "",
                        note_type=str(row["作品类型"]) if row["作品类型"] else "",
                        title=str(row["作品标题"]) if row["作品标题"] else "",
                        desc=str(row["作品描述"]) if row["作品描述"] else "",
                        tags=str(row["作品标签"]) if row["作品标签"] else "",
                        publish_time=str(row["发布时间"]).replace("_", " ") if row["发布时间"] else "",
                        collect_time=str(row["采集时间"]) if row["采集时间"] else "",
                        liked_count=_safe_int(row["点赞数量"]),
                        comment_count=_safe_int(row["评论数量"]),
                        share_count=_safe_int(row["分享数量"]),
                        collect_count=_safe_int(row["收藏数量"]),
                        author_nickname=str(row["作者昵称"]) if row["作者昵称"] else "",
                        author_id=str(row["作者ID"]) if row["作者ID"] else "",
                        note_url=str(row["作品链接"]) if row["作品链接"] else "",
                    ))
                conn.close()
                return notes
            conn.close()
        except Exception as e:
            print(f"[WARN] 读取 XHS 数据库失败: {e}")

    # 无真实数据时返回空列表
    return []


def _safe_int(value) -> int:
    """安全转换数据库中的文本数字，处理中文计数（万/亿）和 -1"""
    if not value:
        return 0
    text = str(value).strip()
    try:
        # 处理中文计数单位：1.9万 → 19000, 3.2亿 → 320000000
        if "万" in text:
            return int(float(text.replace("万", "")) * 10000)
        if "亿" in text:
            return int(float(text.replace("亿", "")) * 100000000)
        result = int(text)
        return max(result, 0)  # -1 等异常值归零
    except (ValueError, TypeError):
        return 0


def compute_xhs_stats(notes: List[XHSNoteRecord]) -> XHSStats:
    """从小红书作品列表计算汇总统计"""
    if not notes:
        return XHSStats()

    total_likes = sum(n.liked_count for n in notes)
    total_comments = sum(n.comment_count for n in notes)
    total_shares = sum(n.share_count for n in notes)
    total_collects = sum(n.collect_count for n in notes)
    total_engagement = total_likes + total_comments + total_shares + total_collects

    # 按类型统计
    video_count = sum(1 for n in notes if n.note_type == "视频")
    gallery_count = sum(1 for n in notes if n.note_type == "图集")
    image_count = sum(1 for n in notes if n.note_type == "图文")

    # 按作者聚合
    author_map: dict[str, dict] = {}
    for n in notes:
        if n.author_id not in author_map:
            author_map[n.author_id] = {"name": n.author_nickname, "notes": 0, "engagement": 0}
        author_map[n.author_id]["notes"] += 1
        author_map[n.author_id]["engagement"] += n.engagement
    top_authors = sorted(
        [{"name": v["name"], "notes": v["notes"], "engagement": v["engagement"]} for v in author_map.values()],
        key=lambda x: x["engagement"],
        reverse=True,
    )[:5]

    # 爆款内容 (互动量 Top 5)
    sorted_by_engagement = sorted(notes, key=lambda n: n.engagement, reverse=True)
    trending_notes = sorted_by_engagement[:5]

    # 低互动预警 (互动量 < 50)
    low_engagement_notes = [n for n in notes if n.engagement < 50][:5]

    return XHSStats(
        total_notes=len(notes),
        total_likes=total_likes,
        total_comments=total_comments,
        total_shares=total_shares,
        total_collects=total_collects,
        total_engagement=total_engagement,
        avg_engagement=round(total_engagement / len(notes), 1),
        video_count=video_count,
        image_count=image_count,
        gallery_count=gallery_count,
        top_authors=top_authors,
        trending_notes=trending_notes,
        low_engagement_notes=low_engagement_notes,
    )
