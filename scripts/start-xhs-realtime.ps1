param(
  [string]$ChromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe",
  [int]$CdpPort = 9333,
  [int]$BrowserSearchPort = 5558,
  [switch]$SkipChromeStart,
  [switch]$SkipBrowserSearchStart
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $RepoRoot "backend"
$ChromeProfileDir = Join-Path $RepoRoot ".chrome-xhs"
$ChromeUrl = "https://www.xiaohongshu.com/explore"
$CdpBase = "http://127.0.0.1:$CdpPort"
$BrowserBase = "http://127.0.0.1:$BrowserSearchPort"

function Test-HttpJson {
  param(
    [Parameter(Mandatory = $true)][string]$Url,
    [string]$Method = "GET",
    [int]$TimeoutSec = 5
  )

  try {
    return Invoke-RestMethod -Method $Method -Uri $Url -TimeoutSec $TimeoutSec
  } catch {
    return $null
  }
}

function Wait-HttpJson {
  param(
    [Parameter(Mandatory = $true)][string]$Url,
    [int]$TimeoutSec = 15,
    [int]$IntervalMs = 500
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  do {
    $result = Test-HttpJson $Url
    if ($result) {
      return $result
    }
    Start-Sleep -Milliseconds $IntervalMs
  } while ((Get-Date) -lt $deadline)

  return $null
}

function Test-PortListening {
  param([Parameter(Mandatory = $true)][int]$Port)

  $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  return [bool]$conn
}

function Write-Step {
  param([Parameter(Mandatory = $true)][string]$Message)
  Write-Host "==> $Message"
}

if (-not (Test-Path -LiteralPath $BackendDir)) {
  throw "Backend directory not found: $BackendDir"
}

if (-not (Test-Path -LiteralPath (Join-Path $BackendDir "node_modules"))) {
  Write-Step "Installing backend Node dependencies"
  Push-Location $BackendDir
  try {
    npm.cmd ci
  } finally {
    Pop-Location
  }
}

$cdpVersion = Test-HttpJson "$CdpBase/json/version"
if (-not $cdpVersion -and -not $SkipChromeStart) {
  if (-not (Test-Path -LiteralPath $ChromePath)) {
    throw "Chrome not found at $ChromePath. Pass -ChromePath with a valid Chrome or Edge executable."
  }

  Write-Step "Starting Chrome with CDP on port $CdpPort"
  New-Item -ItemType Directory -Path $ChromeProfileDir -Force | Out-Null
  $chromeArgs = @(
    "--remote-debugging-port=$CdpPort",
    "--no-first-run",
    "--no-default-browser-check",
    "--user-data-dir=$ChromeProfileDir",
    $ChromeUrl
  )
  Start-Process -FilePath $ChromePath -ArgumentList $chromeArgs -WindowStyle Normal
  $cdpVersion = Wait-HttpJson "$CdpBase/json/version" -TimeoutSec 20
}

if (-not $cdpVersion) {
  throw "Chrome CDP is not available at $CdpBase. Start Chrome with --remote-debugging-port=$CdpPort."
}

$browserHealth = Test-HttpJson "$BrowserBase/health"
if (-not $browserHealth -and -not $SkipBrowserSearchStart) {
  Write-Step "Starting XHS Browser Search Service on port $BrowserSearchPort"
  $nodePath = (Get-Command node.exe -ErrorAction Stop).Source
  $env:XHS_CDP_URL = $CdpBase
  $env:XHS_BROWSER_PORT = [string]$BrowserSearchPort
  $startArgs = "/c start `"XHS Browser Search`" /min `"$nodePath`" xhs_browser_search.js"
  Start-Process `
    -FilePath "cmd.exe" `
    -ArgumentList $startArgs `
    -WorkingDirectory $BackendDir `
    -WindowStyle Hidden
  $browserHealth = Wait-HttpJson "$BrowserBase/health" -TimeoutSec 20
}

$loginStatus = Test-HttpJson "$BrowserBase/login-status"

$status = [ordered]@{
  chrome_cdp_running = [bool]$cdpVersion
  chrome_cdp_url = $CdpBase
  browser_search_running = [bool]$browserHealth
  browser_search_url = $BrowserBase
  browser_connected = [bool]($browserHealth -and $browserHealth.browser_connected)
  xhs_pages = if ($browserHealth) { $browserHealth.xhs_pages } else { 0 }
  browser_logged_in = [bool]($loginStatus -and $loginStatus.loggedIn)
  needs_login = [bool]($loginStatus -and $loginStatus.needsLogin)
}

Write-Host ""
Write-Host "XHS realtime status:"
$status | ConvertTo-Json -Depth 4

if (-not $status.browser_logged_in) {
  Write-Host ""
  if (-not $status.browser_search_running) {
    Write-Host "Action required: XHS Browser Search did not start at $BrowserBase. Check the port and backend dependencies, then rerun this script." -ForegroundColor Yellow
    exit 3
  }

  Write-Host "Action required: log in to Xiaohongshu in the Chrome window, then rerun this script." -ForegroundColor Yellow
  exit 2
}

Write-Host ""
Write-Host "XHS realtime search is ready." -ForegroundColor Green
