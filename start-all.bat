@echo off
REM CodeInsight AI - Start All Services
REM This script starts all three services in separate windows

echo ========================================
echo   CodeInsight AI - Starting Services
echo ========================================
echo.

set PROJECT_ROOT=%~dp0

echo [1/3] Starting AI Service (Python - Port 8000)...
start "AI Service - Port 8000" cmd /k "cd /d %PROJECT_ROOT%ai-service && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

timeout /t 3 /nobreak > nul

echo [2/3] Starting Backend Server (Node.js - Port 5000)...
start "Backend Server - Port 5000" cmd /k "cd /d %PROJECT_ROOT%server && npm run dev"

timeout /t 2 /nobreak > nul

echo [3/3] Starting Frontend Client (React - Port 3000)...
start "Frontend Client - Port 3000" cmd /k "cd /d %PROJECT_ROOT%client && npm run dev"

echo.
echo ========================================
echo   All services started!
echo ========================================
echo.
echo   Frontend:    http://localhost:3000
echo   Backend:     http://localhost:5000
echo   AI Service:  http://localhost:8000
echo.
echo Press any key to open the app in your browser...
pause > nul

start http://localhost:3000
