"""报告 API — 生成、查询运营晨报"""

from fastapi import APIRouter, HTTPException

from app.schemas import GenerateReportRequest
from app.services.report_generator import ReportGenerator

router = APIRouter()

# 全局报告生成器实例
_generator = ReportGenerator()


@router.post("/generate")
async def generate_report(request: GenerateReportRequest):
    """生成运营晨报"""
    report = await _generator.generate(
        data_dir=request.data_dir,
        use_mock=request.use_mock,
        send_email=request.send_email,
    )
    return report.model_dump()


@router.get("")
async def list_reports():
    """获取报告列表"""
    reports = _generator.list_reports()
    return {"reports": reports, "total": len(reports)}


@router.get("/latest")
async def get_latest_report():
    """获取最新报告"""
    report = _generator.get_latest_report()
    if report is None:
        raise HTTPException(status_code=404, detail="暂无报告")
    return report.model_dump()


@router.get("/{report_id}")
async def get_report(report_id: str):
    """获取单个报告详情"""
    report = _generator.get_report(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="报告不存在")
    return report.model_dump()
