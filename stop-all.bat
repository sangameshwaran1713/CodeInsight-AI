@echo off
REM CodeInsight AI - Stop All Services
REM This script stops all running services

echo ========================================
echo   CodeInsight AI - Stopping Services
echo ========================================
echo.

echo Stopping Node.js processes (Backend & Frontend)...
taskkill /F /IM node.exe 2>nul
if %ERRORLEVEL% EQU 0 (
    echo   Node.js processes stopped.
) else (
    echo   No Node.js processes found.
)

echo Stopping Python processes (AI Service)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000"') do (
    taskkill /F /PID %%a 2>nul
)

echo.
echo ========================================
echo   All services stopped!
echo ========================================
echo.
pause
