@echo off
title SECUREFACE AI - Backend Service
cd /d "%~dp0"
echo ========================================================
echo Starting SECUREFACE AI FastAPI Backend (Port 8000)...
echo ========================================================
set "PYTHONPATH=%~dp0"
set "PY_CMD=python"
if exist .venv\Scripts\python.exe (
    set "PY_CMD=.venv\Scripts\python.exe"
) else if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" (
    set "PY_CMD=%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
)
"%PY_CMD%" -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
pause
