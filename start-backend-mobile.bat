@echo off
echo ========================================
echo Starting Backend for Mobile Testing
echo ========================================
echo.
echo Backend URL: http://192.168.210.240:8000
echo.
echo IMPORTANT:
echo 1. Make sure Windows Firewall allows port 8000
echo 2. The server will be accessible from mobile devices
echo.
echo Press Ctrl+C to stop the server
echo.
cd "%~dp0backend"
python manage.py runserver 0.0.0.0:8000
