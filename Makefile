.PHONY: install backend frontend mock dev test xhs xhs-api xhs-cli xhs-collect xhs-gateway xhs-browser all-services

# 安装前后端依赖
install:
	cd backend && pip3 install -r requirements.txt
	cd frontend && npm install
	@echo "=== 依赖安装完成 ==="

# 启动后端 (端口 8000)
backend:
	cd backend && python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 启动前端 (端口 3000)
frontend:
	cd frontend && npm run dev

# 生成模拟数据
mock:
	cd backend && python3 -m app.data.generate_mock
	@echo "=== 模拟数据生成完成 ==="

# 同时启动前后端 (需要分别在两个终端运行)
dev:
	@echo "请在两个终端分别运行:"
	@echo "  make backend"
	@echo "  make frontend"
	@echo ""
	@echo "或使用:"
	@echo "  make backend &"
	@echo "  make frontend"

# ---- XHS-Downloader 小红书数据采集 ----

# XHS-Downloader 路径
XHS_DIR = $(HOME)/Desktop/XHS-Downloader
XHS_PY = $(XHS_DIR)/venv/bin/python3

# 启动 XHS-Downloader TUI 交互模式
xhs:
	cd $(XHS_DIR) && ./venv/bin/python3 main.py

# 启动 XHS-Downloader API 服务 (端口 5556)
xhs-api:
	cd $(XHS_DIR) && ./venv/bin/python3 main.py API

# CLI 模式采集单条链接 (用法: make xhs-cli URL="http://xhslink.com/xxx")
xhs-cli:
	cd $(XHS_DIR) && ./venv/bin/python3 main.py -u "$(URL)"

# 批量采集探索页数据 (打开浏览器提取链接后批量采集)
xhs-collect:
	@echo "请在浏览器打开 https://www.xiaohongshu.com/explore"
	@echo "然后在 SellerPulse XHS Insights 页面点击「同步数据」按钮"

# 快速测试: 用模拟数据生成报告
test:
	curl -s -X POST http://localhost:8000/api/reports/generate \
		-H "Content-Type: application/json" \
		-d '{"use_mock": true, "send_email": false}' | python3 -m json.tool

# ---- 实时搜索服务 ----

# 启动 XHS API Gateway (端口 5557)
xhs-gateway:
	cd backend && python3 xhs_api_gateway.py

# 启动 Comet 浏览器 CDP + Browser Search (端口 9333 + 5558)
xhs-browser:
	@mkdir -p /tmp/xhs-browser
	@-kill $$(lsof -t -i:9333) 2>/dev/null || true
	@-kill $$(lsof -t -i:5558) 2>/dev/null || true
	"/Applications/Comet.app/Contents/MacOS/Comet" --remote-debugging-port=9333 --no-first-run --user-data-dir=/tmp/xhs-browser &
	@sleep 3
	cd backend && node xhs_browser_search.js

# 启动所有服务（后端 + 前端 + Gateway + 浏览器搜索）
all-services:
	@echo "=== 启动所有服务 ==="
	@echo "1. XHS-Downloader API (5556)..."
	@-cd $(XHS_DIR) && ./venv/bin/python3 main.py API &
	@echo "2. XHS API Gateway (5557)..."
	@-cd backend && python3 xhs_api_gateway.py &
	@echo "3. Comet Browser CDP (9333) + Browser Search (5558)..."
	@-mkdir -p /tmp/xhs-browser
	@-"/Applications/Comet.app/Contents/MacOS/Comet" --remote-debugging-port=9333 --no-first-run --user-data-dir=/tmp/xhs-browser &
	@sleep 3
	@-cd backend && node xhs_browser_search.js &
	@echo "4. Backend (8000)..."
	@-cd backend && python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
	@echo "5. Frontend (3000)..."
	@-cd frontend && npm run dev &
	@echo ""
	@echo "=== 所有服务已启动 ==="
	@echo "  Backend:  http://localhost:8000"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Gateway:  http://localhost:5557"
	@echo "  Browser:  http://localhost:5558"
