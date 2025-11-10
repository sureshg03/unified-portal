@echo off
REM ============================================
REM CDOE Two Portal - Quick Database Setup
REM ============================================

echo ============================================
echo CDOE TWO PORTAL - DATABASE SETUP
echo ============================================
echo.

echo This script will:
echo 1. Create three MySQL databases
echo 2. Run Django migrations
echo 3. Verify table creation
echo.

echo IMPORTANT: Make sure MySQL is running!
echo.
pause

echo.
echo Installing pymysql...
pip install pymysql >nul 2>&1
echo Done!
echo.

echo Running interactive setup...
echo Please enter your MySQL credentials when prompted.
echo.

python migrate_all_interactive.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo SUCCESS! All databases are ready!
    echo ============================================
    echo.
    echo You can now:
    echo   - Open MySQL Workbench to see the databases
    echo   - Run: python manage.py runserver
    echo   - Create test users: python create_test_users.py
    echo.
) else (
    echo.
    echo ============================================
    echo SETUP FAILED
    echo ============================================
    echo Please check the error messages above.
    echo.
)

pause
