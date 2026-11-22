@echo off
title SECUREFACE AI - Cloudflare Live Tunnel
cd /d "%~dp0"
echo ========================================================
echo Launching SECUREFACE AI with Cloudflare Public Tunnel...
echo ========================================================

echo 1. Starting Backend (Port 8000)...
start "SECUREFACE Backend" cmd /k "run_backend.bat"

echo 2. Starting Frontend (Port 5173)...
start "SECUREFACE Frontend" cmd /k "run_frontend.bat"

echo 3. Waiting for servers to initialize...
timeout /t 4 /nobreak >nul

echo 4. Starting Cloudflare Tunnel (https)...
echo --------------------------------------------------------
echo Look for the https://....trycloudflare.com link below!
echo --------------------------------------------------------
.\cloudflared.exe tunnel --url http://localhost:5173
pause
