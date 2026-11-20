@echo off
title SECUREFACE AI - Backend Service
cd /d "%~dp0"
echo ========================================================
echo Starting SECUREFACE AI FastAPI Backend (Port 8000)...
echo ========================================================
if exist .venv\Scripts\activate.bat (
    call .venv\Scripts\activate.bat
)
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
pause
