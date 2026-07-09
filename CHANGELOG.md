# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project follows Semantic Versioning where applicable.

## [Unreleased]

### Added

- Added Windows-first local setup documentation for running the FastAPI backend and Next.js frontend.
- Added `backend/.env.example` with non-secret default configuration placeholders.
- Added XHS bundled JSON fallback data for `/api/xhs/stats` and `/api/xhs/notes` when XHS-Downloader SQLite data is unavailable.
- Added Windows instructions and an npm script for running the XHS Browser Search realtime service.
- Added `scripts/start-xhs-realtime.ps1` for one-command Chrome CDP and Browser Search startup with self-check output.
- Added strict realtime search mode via `realtime_only`, exposed in the XHS page as a `只看实时` toggle.

### Changed

- Improved mobile layout behavior by replacing the fixed mobile sidebar with a top navigation bar, responsive dashboard toolbar, and responsive dashboard grids.
- Allowed local frontend development ports beyond 3000 for FastAPI CORS during localhost testing.
- Disabled XHS data sync when the XHS-Downloader API is offline to avoid implying that sync can run without the local service.
- Ignored project-local Python virtual environments via `.venv/`.
- Displayed XHS Gateway and Browser Search service status in the XHS search UI.
- Added Browser Search login status to `/api/xhs/search-engine` so the UI can distinguish an online-but-not-logged-in browser from a usable realtime search session.
- Displayed `gateway_live`, `browser_live`, and `user_live` result sources as realtime badges instead of falling back to the generic search-library label.
- Ignored the local `.chrome-xhs/` browser profile used for CDP realtime search testing.
- Kept default XHS search fallback behavior while allowing strict realtime searches to avoid local `json_db` rows.
- Scoped XHS search statistics and the result table to the realtime response while strict realtime mode is active, including empty realtime responses.
- Made the XHS realtime startup script pass custom CDP and Browser Search ports through to Node and wait for health checks before reporting readiness.

### Fixed

- Fixed a JSX parse error in the inventory forecast panel caused by an unescaped `<` character in Chinese UI copy.
- Avoided Browser Search 500 errors when the XHS search page does not reach network idle, and reported an explicit `not_logged_in` state when the CDP browser is not logged in.
