"""邮件推送服务 — 异步发送 HTML 格式运营晨报"""

import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List

import aiosmtplib

from app.config import get_settings
from app.schemas import Issue, ReportData, Severity

logger = logging.getLogger(__name__)

# 严重度颜色映射
SEVERITY_COLORS = {
    Severity.HIGH: "#dc2626",
    Severity.MEDIUM: "#f59e0b",
    Severity.LOW: "#3b82f6",
}

SEVERITY_LABELS = {
    Severity.HIGH: "高优先级",
    Severity.MEDIUM: "中优先级",
    Severity.LOW: "低优先级",
}

ISSUE_TYPE_LABELS = {
    "inventory_low_stock": "库存预警",
    "ad_waste": "广告无效花费",
    "keyword_low_conversion": "关键词低转化",
    "negative_review": "差评归因",
    "conversion_drop": "转化率骤降",
}


def _build_html_report(report: ReportData) -> str:
    """构造 HTML 邮件内容"""
    issues_html: List[str] = []
    for i, issue in enumerate(report.issues, 1):
        color = SEVERITY_COLORS.get(issue.severity, "#6b7280")
        label = SEVERITY_LABELS.get(issue.severity, "")
        type_label = ISSUE_TYPE_LABELS.get(issue.type.value, issue.type.value)

        issues_html.append(f"""
        <div style="margin-bottom: 16px; padding: 16px; border-left: 4px solid {color}; background: #f9fafb; border-radius: 4px;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="background: {color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 8px;">{label}</span>
                <span style="color: #6b7280; font-size: 14px;">{type_label}</span>
            </div>
            <p style="margin: 4px 0; color: #111827; font-size: 15px;">{i}. {issue.description}</p>
            <p style="margin: 4px 0; color: #059669; font-size: 14px;">→ {issue.recommended_action}</p>
        </div>
        """)

    summary_html = report.summary.overview.replace("\n", "<br>") if report.summary.overview else "暂无总结"

    return f"""
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px;">
        <div style="background: #1e3a5f; padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">{report.summary.title or '运营晨报'}</h1>
            <p style="color: #93c5fd; margin: 4px 0 0;">{report.date} | SellerPulse Agent</p>
        </div>
        <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
            <div style="display: flex; gap: 12px; margin-bottom: 20px;">
                <div style="flex: 1; text-align: center; padding: 12px; background: #fef2f2; border-radius: 6px;">
                    <div style="font-size: 28px; font-weight: bold; color: #dc2626;">{report.high_count}</div>
                    <div style="font-size: 12px; color: #6b7280;">高优先级</div>
                </div>
                <div style="flex: 1; text-align: center; padding: 12px; background: #fffbeb; border-radius: 6px;">
                    <div style="font-size: 28px; font-weight: bold; color: #f59e0b;">{report.medium_count}</div>
                    <div style="font-size: 12px; color: #6b7280;">中优先级</div>
                </div>
                <div style="flex: 1; text-align: center; padding: 12px; background: #eff6ff; border-radius: 6px;">
                    <div style="font-size: 28px; font-weight: bold; color: #3b82f6;">{report.low_count}</div>
                    <div style="font-size: 12px; color: #6b7280;">低优先级</div>
                </div>
            </div>
            <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 12px;">晨报概览</h2>
            <div style="background: #f0f9ff; padding: 16px; border-radius: 6px; margin-bottom: 20px; color: #0c4a6e; font-size: 14px; line-height: 1.6;">
                {summary_html}
            </div>
            <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 12px;">问题详情 ({report.issue_count})</h2>
            {''.join(issues_html) if issues_html else '<p style="color: #6b7280;">今日未检测到异常问题。</p>'}
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
                <p>SellerPulse Agent | 跨境电商运营晨报</p>
                <p>{'由 AI 生成' if report.summary.ai_powered else '模板生成（未配置 AI）'}</p>
            </div>
        </div>
    </body>
    </html>
    """


def _build_text_report(report: ReportData) -> str:
    """构造纯文本邮件内容（备用）"""
    lines = [
        f"{report.summary.title or '运营晨报'}",
        f"日期: {report.date}",
        f"问题总数: {report.issue_count} (高:{report.high_count} 中:{report.medium_count} 低:{report.low_count})",
        "",
        "=== 晨报概览 ===",
        report.summary.overview or "暂无总结",
        "",
        "=== 问题详情 ===",
    ]
    for i, issue in enumerate(report.issues, 1):
        lines.append(f"{i}. [{issue.severity.value.upper()}] {issue.description}")
        lines.append(f"   → {issue.recommended_action}")
        lines.append("")
    return "\n".join(lines)


async def send_report(report: ReportData) -> bool:
    """
    异步发送晨报邮件。
    返回 True 表示成功，False 表示跳过或失败。
    """
    settings = get_settings()

    if not settings.has_smtp:
        logger.warning("未配置 SMTP，跳过邮件发送")
        return False

    if not settings.email_to:
        logger.warning("未配置收件人邮箱，跳过邮件发送")
        return False

    # 构造邮件
    msg = MIMEMultipart("alternative")
    msg["From"] = settings.email_from
    msg["To"] = settings.email_to
    msg["Subject"] = f"[SellerPulse] {report.summary.title or '运营晨报'} - {report.date}"

    html_content = _build_html_report(report)
    text_content = _build_text_report(report)

    msg.attach(MIMEText(text_content, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user,
            password=settings.smtp_password,
            start_tls=True,
        )
        logger.info(f"晨报邮件已发送至 {settings.email_to}")
        return True
    except Exception as e:
        logger.error(f"邮件发送失败: {e}")
        return False
