@echo off
title PathForge AI Launcher
echo ============================================================
echo           Starting PathForge AI (Backend + Frontend)
echo ============================================================
echo.

cd /d "%~dp0"
set "PYTHON_EXE=python"
if exist "%~dp0.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%~dp0.venv\Scripts\python.exe"
)

echo [1/3] Launching FastAPI Backend on http://127.0.0.1:8000...
start "PathForge AI - Backend (Port 8000)" cmd /k "cd /d "%~dp0backend" && "%PYTHON_EXE%" -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

echo Waiting for backend to initialize...
timeout /t 4 /nobreak >nul

echo [2/3] Launching Vite Frontend on http://localhost:5173...
start "PathForge AI - Frontend (Port 5173)" cmd /k "cd /d "%~dp0frontend" && npm.cmd run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Launching Web Browser...
start http://localhost:5173

echo.
echo ============================================================
echo   All services have been launched!
echo.
echo   * Frontend URL:   http://localhost:5173
echo   * Backend API:    http://127.0.0.1:8000
echo   * API Docs:       http://127.0.0.1:8000/docs
echo.
echo   Default Credentials:
echo     Email:    alex.chen@stanford.edu
echo     Password: password123
echo ============================================================
echo.
pause
