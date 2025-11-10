@echo off
REM Setup Script for Unified Education Portal (Windows)

echo ========================================
echo   Unified Education Portal Setup
echo ========================================
echo.

REM Backend Setup
echo [1/4] Setting up Backend...
cd backend

echo Creating virtual environment...
python -m venv venv

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing Python dependencies...
pip install -r requirements.txt

echo.
echo Backend setup complete!
echo.
echo IMPORTANT: Please configure MySQL databases:
echo   1. Create databases: lsc_portal_db, online_edu, lsc_admindb
echo   2. Update password in backend\backend\settings.py
echo   3. Run migrations: python manage.py migrate
echo.

cd ..

REM Frontend Setup
echo [2/4] Setting up Frontend...
cd frontend

echo Installing Node dependencies...
call npm install

echo.
echo Frontend setup complete!
echo.

cd ..

echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next Steps:
echo   1. Configure MySQL databases
echo   2. Update backend\backend\settings.py
echo   3. Run: cd backend ^&^& python manage.py migrate
echo   4. Run: start.bat to launch the application
echo.
pause
