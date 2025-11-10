@echo off
echo ========================================
echo  UNIFIED PORTAL STARTUP
echo  Starting Both Backend and Frontend
echo ========================================
echo.

REM Start Backend Server
echo [1/2] Starting Django Backend Server on port 8000...
start "Django Backend" cmd /k "cd /d "%~dp0backend" && python manage.py runserver 8000"

REM Wait a moment for backend to initialize
timeout /t 3 /nobreak > nul

REM Start Frontend Server
echo [2/2] Starting Vite Frontend Server on port 8081...
start "Vite Frontend" cmd /k "cd /d "%~dp0frontend" && node node_modules\vite\bin\vite.js --port 8081"

echo.
echo ========================================
echo  SERVERS STARTED SUCCESSFULLY!
echo ========================================
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:8081
echo ========================================
echo.
echo Press any key to stop both servers...
pause > nul

REM Kill both servers
echo Stopping servers...
taskkill /FI "WindowTitle eq Django Backend*" /F > nul 2>&1
taskkill /FI "WindowTitle eq Vite Frontend*" /F > nul 2>&1
echo Servers stopped.
