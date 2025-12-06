@echo off
echo ========================================
echo Windows Firewall Configuration
echo ========================================
echo.
echo This will add firewall rules to allow:
echo - Port 8000 (Django Backend)
echo - Port 8080 (Vite Frontend)
echo.
echo You need to run this as Administrator!
echo.
pause

echo Adding firewall rule for Django (Port 8000)...
netsh advfirewall firewall add rule name="Django Backend - Port 8000" dir=in action=allow protocol=TCP localport=8000

echo Adding firewall rule for Vite (Port 8080)...
netsh advfirewall firewall add rule name="Vite Frontend - Port 8080" dir=in action=allow protocol=TCP localport=8080

echo.
echo ========================================
echo Firewall rules added successfully!
echo ========================================
echo.
echo You can now:
echo 1. Run start-backend-mobile.bat
echo 2. Run frontend\start-mobile.bat
echo 3. Access from mobile at http://192.168.210.240:8080
echo.
pause
