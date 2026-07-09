"""FastAPI 应用入口"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import overview, reports, settings as settings_router, upload, xhs

app = FastAPI(
    title="SellerPulse Agent",
    description="跨境电商运营晨报 Agent API",
    version="1.0.0",
)

# CORS — 允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):[0-9]+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载路由
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(settings_router.router, prefix="/api/settings", tags=["settings"])
app.include_router(overview.router, prefix="/api/overview", tags=["overview"])
app.include_router(xhs.router, prefix="/api/xhs", tags=["xhs"])


@app.get("/")
async def root():
    return {"message": "SellerPulse Agent API", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "ok"}
