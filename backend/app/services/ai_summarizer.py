"""MiniMax AI 总结服务 — 将检测到的问题生成结构化运营晨报

MiniMax API 兼容 OpenAI 协议，使用 openai SDK 配合自定义 base_url 即可调用。
端点: https://api.minimaxi.com/v1/chat/completions
模型: MiniMax-M3
"""

import json
import logging
from typing import List

from app.config import get_settings
from app.schemas import Issue, ReportSummary, Severity

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = """你是一位资深跨境电商运营专家，擅长从数据中发现问题并给出可执行的建议。
你的任务是：根据规则引擎检测到的问题，生成一份简洁、专业的运营晨报。

输出要求：
1. 用中文输出
2. 返回 JSON 格式，包含以下字段：
{
  "title": "晨报标题，如：2026-07-06 运营晨报",
  "overview": "整体概况，2-3句话总结今日发现的主要问题和建议方向",
  "priority_actions": ["最紧急的 1-3 个行动"],
  "issue_analyses": [
    {
      "issue_index": 1,
      "analysis": "对该问题的深入分析（1-2句）",
      "action": "具体建议行动"
    }
  ]
}
3. 按严重度排序：HIGH 优先，然后 MEDIUM，最后 LOW
4. 语气专业但简洁，不要啰嗦
"""


def _build_user_prompt(issues: List[Issue]) -> str:
    """构造发送给 OpenAI 的用户 prompt"""
    if not issues:
        return "今日未检测到异常问题，请生成一份'一切正常'的晨报概览。"

    lines = ["今日规则引擎检测到以下问题：\n"]
    for i, issue in enumerate(issues, 1):
        lines.append(f"{i}. [{issue.severity.value.upper()}] {issue.type.value}")
        lines.append(f"   SKU/对象: {issue.sku or issue.target}")
        lines.append(f"   描述: {issue.description}")
        lines.append(f"   初步建议: {issue.recommended_action}")
        lines.append("")
    lines.append("请根据以上信息生成结构化运营晨报。")
    return "\n".join(lines)


async def summarize(issues: List[Issue]) -> ReportSummary:
    """
    调用 OpenAI 生成晨报总结。
    如果未配置 API Key 或调用失败，降级为模板生成。
    """
    settings = get_settings()

    if not settings.has_minimax:
        logger.info("未配置 MiniMax API Key，使用模板降级生成")
        return _template_summarize(issues)

    try:
        return await _minimax_summarize(issues, settings)
    except Exception as e:
        logger.warning(f"MiniMax 调用失败，降级为模板生成: {e}")
        return _template_summarize(issues)


async def _minimax_summarize(issues: List[Issue], settings) -> ReportSummary:
    """调用 MiniMax API（OpenAI 兼容协议）"""
    from openai import AsyncOpenAI

    client = AsyncOpenAI(
        api_key=settings.minimax_api_key,
        base_url=settings.minimax_base_url,
    )
    user_prompt = _build_user_prompt(issues)

    response = await client.chat.completions.create(
        model=settings.minimax_model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
        max_tokens=4096,
    )

    content = response.choices[0].message.content
    if not content:
        return _template_summarize(issues)

    # MiniMax-M3 可能在 content 中包含思考过程 + JSON 代码块
    # 提取 ```json ... ``` 中的 JSON
    import re
    json_match = re.search(r'```json\s*([\s\S]*?)```', content)
    json_text = json_match.group(1).strip() if json_match else content.strip()

    try:
        data = json.loads(json_text)
    except json.JSONDecodeError:
        # 如果返回的不是合法 JSON，用原始文本
        # 尝试从 content 中提取 JSON 部分（去掉思考过程）
        # 查找第一个 { 到最后一个 } 之间的内容
        first_brace = content.find("{")
        last_brace = content.rfind("}")
        if first_brace != -1 and last_brace != -1:
            json_candidate = content[first_brace:last_brace + 1]
            try:
                data = json.loads(json_candidate)
            except json.JSONDecodeError:
                return ReportSummary(
                    title="运营晨报",
                    overview=content[:500],
                    ai_powered=True,
                    raw_text=content,
                )
        else:
            return ReportSummary(
                title="运营晨报",
                overview=content[:500],
                ai_powered=True,
                raw_text=content,
            )

    # 构造 overview：包含概况 + 优先行动
    overview_parts = [data.get("overview", "")]
    priority = data.get("priority_actions", [])
    if priority:
        overview_parts.append("\n优先行动：")
        for action in priority:
            overview_parts.append(f"  - {action}")

    # 附加每个问题的 AI 分析
    analyses = data.get("issue_analyses", [])
    if analyses:
        overview_parts.append("\n问题分析：")
        for a in analyses:
            idx = a.get("issue_index", "")
            analysis = a.get("analysis", "")
            action = a.get("action", "")
            overview_parts.append(f"  {idx}. {analysis} → {action}")

    return ReportSummary(
        title=data.get("title", "运营晨报"),
        overview="\n".join(overview_parts),
        ai_powered=True,
        raw_text=content,
    )


def _template_summarize(issues: List[Issue]) -> ReportSummary:
    """模板降级生成（不依赖 AI）"""
    from datetime import datetime

    today = datetime.now().strftime("%Y-%m-%d")

    if not issues:
        return ReportSummary(
            title=f"{today} 运营晨报",
            overview="今日未检测到异常问题，各项指标正常。建议继续保持日常运营节奏，关注库存和广告表现。",
            ai_powered=False,
        )

    high = [i for i in issues if i.severity == Severity.HIGH]
    medium = [i for i in issues if i.severity == Severity.MEDIUM]
    low = [i for i in issues if i.severity == Severity.LOW]

    overview_parts = [
        f"今日共发现 {len(issues)} 个问题",
        f"（高优先级 {len(high)}，中优先级 {len(medium)}，低优先级 {len(low)}）。\n",
    ]

    if high:
        overview_parts.append("需立即处理：")
        for i, issue in enumerate(high, 1):
            overview_parts.append(f"  {i}. {issue.description}")
            overview_parts.append(f"     → {issue.recommended_action}")

    if medium:
        overview_parts.append("\n建议关注：")
        for i, issue in enumerate(medium, 1):
            overview_parts.append(f"  {i}. {issue.description}")
            overview_parts.append(f"     → {issue.recommended_action}")

    if low:
        overview_parts.append("\n日常监控：")
        for i, issue in enumerate(low, 1):
            overview_parts.append(f"  {i}. {issue.description}")

    return ReportSummary(
        title=f"{today} 运营晨报",
        overview="\n".join(overview_parts),
        ai_powered=False,
    )
