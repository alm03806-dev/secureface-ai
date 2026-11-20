@echo off
title SECUREFACE AI - Orchestrator
cd /d "%~dp0"
echo ========================================================
echo Launching SECUREFACE AI Futuristic Verification System...
echo ========================================================
start "SECUREFACE Backend" cmd /k "run_backend.bat"
timeout /t 3 /nobreak >nul
start "SECUREFACE Frontend" cmd /k "run_frontend.bat"
timeout /t 3 /nobreak >nul
start http://localhost:5173
echo Both backend (http://localhost:8000) and frontend (http://localhost:5173) are running.
