# SellerPulse XHS

SellerPulse XHS is a local full-stack dashboard for ecommerce operations and Xiaohongshu/XHS content analysis.

## Stack

- Backend: FastAPI, Uvicorn, Pandas
- Frontend: Next.js 16, React 19, Tailwind CSS 4, Recharts
- Local data: mock ecommerce CSV files, bundled XHS JSON search database, optional XHS-Downloader SQLite data

## Windows Local Run

Run the backend first:

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Then run the frontend in another terminal:

```powershell
cd frontend
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open:

- Frontend: <http://127.0.0.1:3000>
- Backend docs: <http://127.0.0.1:8000/docs>
- Backend health: <http://127.0.0.1:8000/health>

If `py` is not available, use any Python 3.11+ executable to create `backend\.venv`.

## Configuration

Copy `backend/.env.example` to `backend/.env` when local credentials are needed. Do not commit `.env` files.

The frontend defaults to `http://localhost:8000`. Override it when needed:

```powershell
$env:NEXT_PUBLIC_API_BASE = "http://127.0.0.1:8000"
npm run dev -- --hostname 127.0.0.1 --port 3000
```

## XHS Data Behavior

The backend reads real XHS-Downloader data from:

```text
%USERPROFILE%\Desktop\XHS-Downloader\Volume\Download\ExploreData.db
```

When that SQLite database is unavailable, `/api/xhs/stats` and `/api/xhs/notes` fall back to the bundled `backend/app/data/xhs_notes_db.json` dataset so the XHS dashboard remains usable for demos.

## XHS Realtime Search On Windows

Keyword realtime search uses this fallback order:

1. XHS API Gateway on `127.0.0.1:5557`
2. Browser Search Service on `127.0.0.1:5558`
3. Local bundled search data from `json_db`

The Browser Search Service needs a Chrome or Edge instance with Chrome DevTools Protocol enabled. Start Chrome with an isolated local profile:

Recommended one-command startup and self-check:

```powershell
.\scripts\start-xhs-realtime.ps1
```

The script checks Chrome CDP, starts the Browser Search Service when needed, waits for the health endpoint, and reports whether the Xiaohongshu browser session is logged in. If it prints `Action required`, log in to Xiaohongshu in the Chrome window and run the script again. Custom `-CdpPort` and `-BrowserSearchPort` values are passed through to the Browser Search Service.

Manual startup is also supported:

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --remote-debugging-port=9333 `
  --no-first-run `
  --no-default-browser-check `
  --user-data-dir="$PWD\.chrome-xhs" `
  "https://www.xiaohongshu.com/explore"
```

Log in to Xiaohongshu in that browser window, then start the browser search service:

```powershell
cd backend
npm ci
npm run browser-search
```

Verify it:

```powershell
Invoke-RestMethod http://127.0.0.1:5558/health
Invoke-RestMethod http://127.0.0.1:5558/login-status
Invoke-RestMethod -Method Post "http://127.0.0.1:5558/search?keyword=%E7%BE%8E%E9%A3%9F&max_results=5"
```

Realtime keyword search is only confirmed when returned notes have `source` set to `browser_live` or `gateway_live`. If the source is `json_db`, the app is using the bundled local fallback.

The XHS page also has a `只看实时` toggle. When enabled, `/api/xhs/search` sends `realtime_only: true`; if Gateway and Browser Search are both unavailable, the API returns no local fallback rows instead of mixing in `json_db`, and the page keeps search stats/table output scoped to that realtime response.
