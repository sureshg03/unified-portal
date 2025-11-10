@echo off
REM Unified Education Portal - Windows Startup Script
REM This script starts both backend and frontend servers

echo ========================================
echo   Unified Education Portal
echo   Starting Backend and Frontend...
echo ========================================
echo.

REM Start Backend in new window
echo [1/2] Starting Django Backend Server...
start "Django Backend" cmd /k "cd backend && .\venv\Scripts\activate && python manage.py runserver"

REM Wait a bit for backend to start
timeout /t 5 /nobreak >nul

REM Start Frontend in new window
echo [2/2] Starting React Frontend Server...
start "React Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   Servers Starting...
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit this window...
pause >nul
