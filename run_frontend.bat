@echo off
title SECUREFACE AI - 3D Futuristic Frontend
cd /d "%~dp0"
echo ========================================================
echo Starting SECUREFACE AI Vite Frontend (Port 5173)...
echo ========================================================
cd frontend
call npm run dev
pause
