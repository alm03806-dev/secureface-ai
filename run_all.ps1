# SECUREFACE AI Startup Script for PowerShell
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $ScriptDir) { $ScriptDir = $PSScriptRoot }
if (-not $ScriptDir) { $ScriptDir = (Get-Location).Path }
Set-Location $ScriptDir

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Launching SECUREFACE AI Futuristic Verification System" -ForegroundColor Cyan
Write-Host "Working Directory: $ScriptDir" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Start Backend
Start-Process powershell -WorkingDirectory $ScriptDir -ArgumentList "-NoExit", "-Command", "Set-Location '$ScriptDir'; & '.\run_backend.bat'"

# Wait for backend initialization
Start-Sleep -Seconds 3

# Start Frontend
Start-Process powershell -WorkingDirectory $ScriptDir -ArgumentList "-NoExit", "-Command", "Set-Location '$ScriptDir'; & '.\run_frontend.bat'"

# Open Browser
Start-Sleep -Seconds 2
Start-Process "http://localhost:5173"

Write-Host "SECUREFACE AI launched successfully!" -ForegroundColor Green
Write-Host "Backend API:  http://localhost:8000" -ForegroundColor Yellow
Write-Host "Frontend App: http://localhost:5173" -ForegroundColor Yellow
