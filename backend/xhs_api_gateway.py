"""
小红书 API 网关 — 使用 xhshow 签名 + curl_cffi Chrome TLS 指纹
独立 FastAPI 服务，运行在 XHS-Downloader venv 中

启动: /Users/knommm/Desktop/XHS-Downloader/venv/bin/python backend/xhs_api_gateway.py
端口: 5557
"""

import json
import os
import sys
import logging
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from curl_cffi import requests as cffi_requests
from xhshow import Xhshow

# ---- 配置 ----
SETTINGS_PATH = Path.home() / "Desktop" / "XHS-Downloader" / "Volume" / "settings.json"
HOST = "127.0.0.1"
PORT = 5557
BASE_URL = "https://edith.xiaohongshu.com"
WEB_URL = "https://www.xiaohongshu.com"

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("xhs-api-gateway")

# ---- 初始化 ----
app = FastAPI(title="XHS API Gateway", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
signer = Xhshow()


def load_cookie() -> str:
    """从 XHS-Downloader 配置加载 Cookie"""
    try:
        with open(SETTINGS_PATH) as f:
            settings = json.load(f)
        return settings.get("cookie", "")
    except Exception as e:
        logger.error(f"加载 Cookie 失败: {e}")
        return ""


def parse_cookies(cookie_str: str) -> dict:
    """将 cookie 字符串解析为字典"""
    cookies = {}
    for item in cookie_str.split(";"):
        item = item.strip()
        if "=" in item:
            key, value = item.split("=", 1)
            cookies[key.strip()] = value.strip()
    return cookies


def get_cookie_dict() -> dict:
    """获取当前 cookie 字典"""
    return parse_cookies(load_cookie())


# ---- curl_cffi 请求封装 ----

IMPERSONATE = "chrome124"

def cffi_post(uri: str, payload: dict, sign_format="xys", x_rap=True) -> dict:
    """用 curl_cffi + Chrome TLS 指纹发送 POST 请求"""
    cookies = get_cookie_dict()
    headers = signer.sign_headers_post(
        uri=uri, cookies=cookies, payload=payload,
        sign_format=sign_format, x_rap=x_rap,
    )
    headers["referer"] = f"{WEB_URL}/"
    headers["origin"] = WEB_URL
    headers["content-type"] = "application/json"

    resp = cffi_requests.post(
        f"{BASE_URL}{uri}",
        json=payload, headers=headers, cookies=cookies,
        impersonate=IMPERSONATE,
        verify=False,
        timeout=20,
    )
    return resp.json()


def cffi_get(uri: str, params: dict, sign_format="xyw", x_rap=False) -> dict:
    """用 curl_cffi + Chrome TLS 指纹发送 GET 请求"""
    cookies = get_cookie_dict()
    headers = signer.sign_headers_get(
        uri=uri, cookies=cookies, params=params,
        sign_format=sign_format, x_rap=x_rap,
    )
    headers["referer"] = f"{WEB_URL}/"
    headers["origin"] = WEB_URL

    resp = cffi_requests.get(
        f"{BASE_URL}{uri}",
        params=params, headers=headers, cookies=cookies,
        impersonate=IMPERSONATE,
        verify=False,
        timeout=20,
    )
    return resp.json()


# ========================================
#  API 路由
# ========================================

@app.get("/")
async def root():
    return {
        "name": "XHS API Gateway v2",
        "version": "2.0.0",
        "engine": "curl_cffi + xhshow",
        "impersonate": IMPERSONATE,
        "endpoints": [
            "GET  /health",
            "POST /search",
            "GET  /user_posted",
            "GET  /user_info",
            "GET  /feed",
            "GET  /hot_search",
            "GET  /search_suggest",
            "POST /refresh_cookie",
        ],
    }


@app.get("/health")
async def health():
    cookie = load_cookie()
    cookies = parse_cookies(cookie)
    return {
        "status": "ok",
        "cookie_loaded": bool(cookie),
        "cookie_length": len(cookie),
        "has_a1": "a1" in cookies,
        "has_web_session": "web_session" in cookies,
        "engine": "curl_cffi",
        "impersonate": IMPERSONATE,
    }


@app.post("/refresh_cookie")
async def refresh_cookie():
    """Cookie 已刷新（curl_cffi 每次请求都重新读取 cookie）"""
    return {"status": "ok", "message": "Cookie 已刷新"}


# ---- 搜索笔记 ----
@app.post("/search")
async def search_notes(
    keyword: str = Query(..., description="搜索关键词"),
    sort: str = Query("general", description="排序: general/time/popularity"),
    page: int = Query(1, description="页码"),
    note_type: int = Query(0, description="类型: 0=全部, 1=图文, 2=视频"),
):
    """搜索小红书笔记"""
    uri = "/api/sns/web/v1/search/notes"
    payload = {
        "keyword": keyword,
        "search_id": signer.get_search_id(),
        "search_request_id": signer.get_search_request_id(),
        "sort": sort,
        "note_type": note_type,
        "ext_flags": [],
        "image_scenes": [],
        "page": page,
        "page_size": 20,
    }
    try:
        data = cffi_post(uri, payload, x_rap=True)
        code = data.get("code", 0)
        msg = data.get("msg", "")

        # 检查登录状态
        if code == -100:
            return {"success": False, "error": "登录已过期，请重新登录", "code": code, "notes": []}

        if code != 0:
            logger.warning(f"搜索异常: code={code}, msg={msg}")
            return {"success": False, "error": msg or f"code={code}", "code": code, "notes": []}

        items = data.get("data", {}).get("items", [])
        notes = []
        for item in items:
            nc = item.get("note_card") or item.get("noteCard") or {}
            interact = nc.get("interact_info") or nc.get("interactInfo") or {}
            user = nc.get("user") or {}
            note_id = item.get("id") or item.get("note_id") or ""
            xsec = item.get("xsec_token") or ""
            cover = nc.get("cover") or {}
            notes.append({
                "note_id": note_id,
                "title": nc.get("display_title", "") or nc.get("title", ""),
                "desc": nc.get("desc", ""),
                "type": nc.get("type", ""),
                "liked_count": interact.get("liked_count", "0"),
                "collected_count": interact.get("collected_count", "0"),
                "comment_count": interact.get("comment_count", "0"),
                "shared_count": interact.get("share_count", "0"),
                "author_nickname": user.get("nickname", "") or user.get("nick_name", ""),
                "author_id": user.get("user_id", "") or user.get("userId", ""),
                "author_avatar": user.get("avatar", ""),
                "cover_url": cover.get("url_default", "") or cover.get("url", ""),
                "url": f"https://www.xiaohongshu.com/explore/{note_id}?xsec_token={xsec}" if note_id else "",
                "xsec_token": xsec,
            })

        has_more = data.get("data", {}).get("has_more", False)
        logger.info(f"搜索 \"{keyword}\" 第{page}页: {len(notes)} 条, has_more={has_more}")
        return {
            "success": True,
            "keyword": keyword,
            "total": len(notes),
            "has_more": has_more,
            "notes": notes,
        }
    except Exception as e:
        logger.error(f"搜索失败: {e}")
        return {"success": False, "error": str(e), "notes": []}


# ---- 用户发布笔记 ----
@app.get("/user_posted")
async def user_posted(
    user_id: str = Query(..., description="用户 ID"),
    cursor: str = Query("", description="分页游标"),
    num: int = Query(30, description="数量"),
):
    """获取用户发布的笔记列表"""
    uri = "/api/sns/web/v1/user_posted"
    params = {
        "num": str(num),
        "cursor": cursor,
        "user_id": user_id,
        "image_scenes": "FDN_WM_DFT",
    }
    try:
        data = cffi_get(uri, params, sign_format="xyw")
        cursor_data = data.get("data", {})
        notes_list = cursor_data.get("notes", [])
        notes = []
        for note in notes_list:
            interact = note.get("interact_info") or {}
            user = note.get("user") or {}
            note_id = note.get("note_id", "")
            xsec = note.get("xsec_token") or ""
            notes.append({
                "note_id": note_id,
                "title": note.get("display_title", "") or note.get("title", ""),
                "desc": note.get("desc", ""),
                "type": note.get("type", ""),
                "liked_count": interact.get("liked_count", "0"),
                "author_nickname": user.get("nickname", ""),
                "author_id": user.get("user_id", ""),
                "cover_url": (note.get("cover") or {}).get("url_default", ""),
                "url": f"https://www.xiaohongshu.com/explore/{note_id}?xsec_token={xsec}" if note_id else "",
                "xsec_token": xsec,
            })
        return {
            "success": True,
            "user_id": user_id,
            "total": len(notes),
            "has_more": cursor_data.get("has_more", False),
            "cursor": cursor_data.get("cursor", ""),
            "notes": notes,
        }
    except Exception as e:
        logger.error(f"获取用户笔记失败: {e}")
        return {"success": False, "error": str(e), "notes": []}


# ---- 用户信息 ----
@app.get("/user_info")
async def user_info(user_id: str = Query(..., description="用户 ID")):
    """获取用户基本信息"""
    uri = "/api/sns/web/v1/user/otherinfo"
    params = {"target_user_id": user_id}
    try:
        data = cffi_get(uri, params, sign_format="xys")
        ud = data.get("data", {})
        basic = ud.get("basic_info", {})
        interactions = ud.get("interactions", {})
        return {
            "success": True,
            "user_id": user_id,
            "nickname": basic.get("nickname", ""),
            "desc": basic.get("desc", ""),
            "avatar": basic.get("images", ""),
            "fans": interactions.get("fans", "0"),
            "follows": interactions.get("follows", "0"),
            "interaction": interactions.get("interaction", "0"),
            "tags": [t.get("name", "") for t in ud.get("tags", [])],
        }
    except Exception as e:
        logger.error(f"获取用户信息失败: {e}")
        return {"success": False, "error": str(e)}


# ---- 笔记详情 (feed) ----
@app.get("/feed")
async def feed(
    note_id: str = Query(..., description="笔记 ID"),
    xsec_token: str = Query("", description="xsec token"),
):
    """获取单篇笔记详情"""
    uri = "/api/sns/web/v1/feed"
    payload = {
        "source_note_id": note_id,
        "image_formats": ["jpg", "webp", "avif"],
        "extra": {"need_body_topic": "1"},
        "xsec_source": "pc_search",
        "xsec_token": xsec_token,
    }
    try:
        data = cffi_post(uri, payload, x_rap=True)
        items = data.get("data", {}).get("items", [])
        if not items:
            return {"success": False, "error": "no data", "note": None}
        nc = items[0].get("note_card") or {}
        interact = nc.get("interact_info") or {}
        user = nc.get("user") or {}
        return {
            "success": True,
            "note": {
                "note_id": note_id,
                "title": nc.get("title", ""),
                "desc": nc.get("desc", ""),
                "type": nc.get("type", ""),
                "liked_count": interact.get("liked_count", "0"),
                "collected_count": interact.get("collected_count", "0"),
                "comment_count": interact.get("comment_count", "0"),
                "shared_count": interact.get("share_count", "0"),
                "author_nickname": user.get("nickname", ""),
                "author_id": user.get("user_id", ""),
                "images": [
                    img.get("url_default", "") or img.get("info_list", [{}])[0].get("url", "")
                    for img in nc.get("image_list", [])
                ],
                "time": nc.get("time", ""),
                "ip_location": nc.get("ip_location", ""),
                "tag_list": [t.get("name", "") for t in nc.get("tag_list", [])],
            },
        }
    except Exception as e:
        logger.error(f"获取笔记详情失败: {e}")
        return {"success": False, "error": str(e), "note": None}


# ---- 热门搜索 ----
@app.get("/hot_search")
async def hot_search():
    """获取热门搜索词"""
    uri = "/api/sns/web/v1/search/hot_list"
    params = {"source": "search_hot"}
    try:
        data = cffi_get(uri, params, sign_format="xys")
        items = data.get("data", {}).get("items", [])
        hot_list = []
        for item in items:
            hot_list.append({
                "title": item.get("title", ""),
                "score": item.get("score", ""),
                "search_id": item.get("search_id", ""),
            })
        return {"success": True, "total": len(hot_list), "hot_list": hot_list}
    except Exception as e:
        logger.error(f"获取热门搜索失败: {e}")
        return {"success": False, "error": str(e), "hot_list": []}


# ---- 搜索建议 ----
@app.get("/search_suggest")
async def search_suggest(keyword: str = Query(..., description="搜索关键词")):
    """获取搜索建议"""
    uri = "/api/sns/web/v1/fe_recommend"
    params = {"keyword": keyword, "source": "web_search_box"}
    try:
        data = cffi_get(uri, params, sign_format="xys")
        items = data.get("data", {}).get("sug_items", [])
        suggestions = [item.get("text", "") for item in items if item.get("text")]
        return {"success": True, "keyword": keyword, "suggestions": suggestions}
    except Exception as e:
        logger.error(f"获取搜索建议失败: {e}")
        return {"success": False, "error": str(e), "suggestions": []}


# ---- 启动 ----
if __name__ == "__main__":
    import uvicorn
    logger.info(f"XHS API Gateway v2 启动: http://{HOST}:{PORT} (curl_cffi + {IMPERSONATE})")
    uvicorn.run(app, host=HOST, port=PORT, log_level="info")
