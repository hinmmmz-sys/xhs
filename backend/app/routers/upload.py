"""上传 API — CSV 文件上传与模拟数据生成"""

import shutil
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.config import get_settings
from app.services.csv_parser import detect_file_type

router = APIRouter()


@router.post("/upload")
async def upload_files(files: list[UploadFile] = File(...)):
    """上传多个 CSV 文件到 uploads 目录"""
    settings = get_settings()
    uploads_dir = Path(settings.uploads_dir)
    uploads_dir.mkdir(parents=True, exist_ok=True)

    results = []
    for file in files:
        if not file.filename:
            continue
        if not file.filename.lower().endswith(".csv"):
            results.append({
                "filename": file.filename,
                "status": "skipped",
                "reason": "not a CSV file",
            })
            continue

        ftype = detect_file_type(file.filename)
        if ftype is None:
            results.append({
                "filename": file.filename,
                "status": "skipped",
                "reason": "unrecognized file type",
            })
            continue

        filepath = uploads_dir / file.filename
        with open(filepath, "wb") as f:
            content = await file.read()
            f.write(content)

        # 统计行数
        import pandas as pd
        try:
            df = pd.read_csv(filepath)
            row_count = len(df)
        except Exception:
            row_count = 0

        results.append({
            "filename": file.filename,
            "status": "ok",
            "file_type": ftype,
            "rows": row_count,
        })

    uploaded = [r for r in results if r["status"] == "ok"]
    return {
        "message": f"上传完成：{len(uploaded)} 个文件成功",
        "results": results,
        "data_dir": str(uploads_dir),
    }


@router.post("/upload/generate-mock")
async def generate_mock_data():
    """重新生成模拟 CSV 数据"""
    from app.data.generate_mock import generate_all
    from app.config import get_settings

    settings = get_settings()
    mock_dir = Path(settings.mock_dir)
    generated = generate_all(mock_dir)

    return {
        "message": f"已生成 {len(generated)} 个模拟 CSV 文件",
        "files": list(generated.keys()),
        "data_dir": str(mock_dir),
    }


@router.get("/upload/files")
async def list_uploaded_files():
    """列出已上传的 CSV 文件"""
    settings = get_settings()
    uploads_dir = Path(settings.uploads_dir)
    mock_dir = Path(settings.mock_dir)

    files = []

    # 上传的文件
    if uploads_dir.exists():
        for filepath in uploads_dir.glob("*.csv"):
            ftype = detect_file_type(filepath.name)
            files.append({
                "filename": filepath.name,
                "file_type": ftype or "unknown",
                "source": "upload",
                "size": filepath.stat().st_size,
            })

    # 模拟文件
    if mock_dir.exists():
        for filepath in mock_dir.glob("*.csv"):
            ftype = detect_file_type(filepath.name)
            files.append({
                "filename": filepath.name,
                "file_type": ftype or "unknown",
                "source": "mock",
                "size": filepath.stat().st_size,
            })

    return {"files": files}


@router.delete("/upload/clear")
async def clear_uploads():
    """清空上传目录"""
    settings = get_settings()
    uploads_dir = Path(settings.uploads_dir)

    if uploads_dir.exists():
        for filepath in uploads_dir.glob("*.csv"):
            filepath.unlink()

    return {"message": "已清空上传目录"}
