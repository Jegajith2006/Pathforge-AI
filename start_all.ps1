Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "          Starting PathForge AI (Backend + Frontend)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Start Backend in a new window
Write-Host "[1/3] Launching FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Yellow
$backendCmd = "cd /d `"$rootDir\backend`" && `"$rootDir\.venv\Scripts\python.exe`" -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"
Start-Process cmd.exe -ArgumentList "/k", $backendCmd

Write-Host "Waiting for backend to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 4

# 2. Start Frontend in a new window
Write-Host "[2/3] Launching Vite Frontend on http://localhost:5173..." -ForegroundColor Yellow
$frontendCmd = "cd /d `"$rootDir\frontend`" && npm.cmd run dev"
Start-Process cmd.exe -ArgumentList "/k", $frontendCmd

Start-Sleep -Seconds 3

# 3. Open Browser
Write-Host "[3/3] Opening Web Browser..." -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  All services have been launched!" -ForegroundColor Green
Write-Host "  * Frontend URL:   http://localhost:5173" -ForegroundColor White
Write-Host "  * Backend API:    http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  * API Docs:       http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "  Default Credentials:" -ForegroundColor White
Write-Host "    Email:    alex.chen@stanford.edu" -ForegroundColor White
Write-Host "    Password: password123" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Green
