"""报告编排服务 — 串联解析→检测→总结→推送的完整流程"""

import json
import logging
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from app.config import get_settings
from app.schemas import (
    AdvertisingRecord,
    InventoryRecord,
    ReportData,
    ReviewRecord,
    SalesRecord,
    Severity,
)
from app.services import ai_summarizer, csv_parser, email_sender, rule_engine

logger = logging.getLogger(__name__)


class ReportGenerator:
    """运营晨报生成器"""

    def __init__(self):
        self.engine = rule_engine.RuleEngine()

    async def generate(
        self,
        data_dir: Optional[str] = None,
        use_mock: bool = False,
        send_email: bool = False,
    ) -> ReportData:
        """
        生成一份完整的运营晨报。

        Args:
            data_dir: CSV 数据目录，None 则使用 uploads 目录
            use_mock: True 则使用 mock 数据
            send_email: True 则发送邮件
        """
        settings = get_settings()

        # 1. 确定数据目录
        if use_mock:
            source_dir = settings.mock_dir
        elif data_dir:
            source_dir = data_dir
        else:
            source_dir = settings.uploads_dir

        logger.info(f"开始生成晨报，数据目录: {source_dir}")

        # 2. 解析 CSV
        parsed = csv_parser.parse_all_reports(source_dir)
        adv_data: List[AdvertisingRecord] = parsed.get("advertising", [])
        inv_data: List[InventoryRecord] = parsed.get("inventory", [])
        rev_data: List[ReviewRecord] = parsed.get("review", [])
        sales_data: List[SalesRecord] = parsed.get("sales", [])

        logger.info(
            f"解析完成: 广告 {len(adv_data)} 条, 库存 {len(inv_data)} 条, "
            f"评论 {len(rev_data)} 条, 销量 {len(sales_data)} 条"
        )

        # 3. 运行规则引擎
        issues = self.engine.run_all(adv_data, inv_data, rev_data, sales_data)
        logger.info(f"规则引擎检测到 {len(issues)} 个问题")

        # 4. AI 总结
        summary = await ai_summarizer.summarize(issues)
        logger.info(f"晨报总结生成完成 (AI: {summary.ai_powered})")

        # 5. 组装报告
        now = datetime.now()
        report = ReportData(
            id=str(uuid.uuid4())[:8],
            date=now.strftime("%Y-%m-%d"),
            created_at=now.strftime("%Y-%m-%d %H:%M:%S"),
            issues=issues,
            summary=summary,
        )
        report.compute_counts()

        # 6. 可选：发送邮件
        if send_email:
            await email_sender.send_report(report)

        # 7. 保存报告到 JSON 文件
        self._save_report(report)

        return report

    def _save_report(self, report: ReportData) -> str:
        """保存报告到 reports 目录，返回文件路径"""
        settings = get_settings()
        reports_dir = Path(settings.reports_dir)
        reports_dir.mkdir(parents=True, exist_ok=True)

        filename = f"{report.date}_{report.id}.json"
        filepath = reports_dir / filename

        report_json = report.model_dump_json(indent=2, ensure_ascii=False)
        filepath.write_text(report_json, encoding="utf-8")
        logger.info(f"报告已保存: {filepath}")
        return str(filepath)

    def list_reports(self) -> List[dict]:
        """列出所有已保存的报告（简要信息）"""
        settings = get_settings()
        reports_dir = Path(settings.reports_dir)
        if not reports_dir.exists():
            return []

        reports = []
        for filepath in sorted(reports_dir.glob("*.json"), reverse=True):
            try:
                data = json.loads(filepath.read_text(encoding="utf-8"))
                reports.append({
                    "id": data.get("id", ""),
                    "date": data.get("date", ""),
                    "created_at": data.get("created_at", ""),
                    "issue_count": data.get("issue_count", 0),
                    "high_count": data.get("high_count", 0),
                    "medium_count": data.get("medium_count", 0),
                    "low_count": data.get("low_count", 0),
                    "title": data.get("summary", {}).get("title", "运营晨报"),
                    "ai_powered": data.get("summary", {}).get("ai_powered", False),
                })
            except (json.JSONDecodeError, OSError):
                continue
        return reports

    def get_report(self, report_id: str) -> Optional[ReportData]:
        """根据 ID 获取完整报告"""
        settings = get_settings()
        reports_dir = Path(settings.reports_dir)
        if not reports_dir.exists():
            return None

        # 查找匹配的文件（文件名格式: date_id.json）
        for filepath in reports_dir.glob("*.json"):
            if report_id in filepath.name:
                try:
                    data = json.loads(filepath.read_text(encoding="utf-8"))
                    return ReportData(**data)
                except (json.JSONDecodeError, OSError, Exception):
                    continue
        return None

    def get_latest_report(self) -> Optional[ReportData]:
        """获取最新报告"""
        reports = self.list_reports()
        if not reports:
            return None
        latest = reports[0]
        return self.get_report(latest["id"])
