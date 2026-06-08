# CodeInsight AI - Start All Services
# PowerShell script to start all three services

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CodeInsight AI - Starting Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start AI Service
Write-Host "[1/3] Starting AI Service (Python - Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectRoot\ai-service'; Write-Host 'AI Service starting...' -ForegroundColor Green; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

Start-Sleep -Seconds 3

# Start Backend Server
Write-Host "[2/3] Starting Backend Server (Node.js - Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectRoot\server'; Write-Host 'Backend Server starting...' -ForegroundColor Green; npm run dev"

Start-Sleep -Seconds 2

# Start Frontend Client
Write-Host "[3/3] Starting Frontend Client (React - Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectRoot\client'; Write-Host 'Frontend Client starting...' -ForegroundColor Green; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All services started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend:    " -NoNewline; Write-Host "http://localhost:3000" -ForegroundColor Blue
Write-Host "  Backend:     " -NoNewline; Write-Host "http://localhost:5000" -ForegroundColor Blue
Write-Host "  AI Service:  " -NoNewline; Write-Host "http://localhost:8000" -ForegroundColor Blue
Write-Host ""

# Wait and open browser
Start-Sleep -Seconds 5
Write-Host "Opening browser..." -ForegroundColor Gray
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "Press Enter to exit this window..."
Read-Host
