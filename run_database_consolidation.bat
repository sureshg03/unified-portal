@echo off
REM ====================================================================
REM CDOE Database Consolidation - Quick Start
REM ====================================================================
REM This script consolidates three databases into one: cdoe_db
REM ====================================================================

echo.
echo ====================================================================
echo             CDOE DATABASE CONSOLIDATION
echo ====================================================================
echo.
echo This will consolidate your databases into a single cdoe_db
echo.
echo Current structure:  lsc_portal_db + online_edu + lsc_admindb
echo Target structure:   cdoe_db (single database)
echo.

REM Step 1: Check current status
echo Step 1: Checking current database status...
echo --------------------------------------------------------------------
python check_database_status.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Database status check failed
    echo Please ensure MySQL is running and credentials are correct
    pause
    exit /b 1
)

echo.
echo.
echo ====================================================================
echo Ready to consolidate databases
echo ====================================================================
echo.
echo IMPORTANT:
echo   - All databases will be backed up automatically
echo   - Original databases will NOT be deleted
echo   - Process is reversible using backups
echo   - Estimated time: 10-15 minutes
echo.

set /p CONFIRM="Do you want to proceed with consolidation? (yes/no): "
if /i NOT "%CONFIRM%"=="yes" (
    echo.
    echo Consolidation cancelled by user
    pause
    exit /b 0
)

echo.
echo.
echo ====================================================================
echo Step 2: Running consolidation script...
echo ====================================================================
echo.

python consolidate_databases.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo.
    echo ====================================================================
    echo ERROR: Consolidation failed
    echo ====================================================================
    echo.
    echo Your original databases are safe and untouched.
    echo Check the error messages above for details.
    echo.
    pause
    exit /b 1
)

echo.
echo.
echo ====================================================================
echo Step 3: Verifying consolidated database...
echo ====================================================================
echo.

python check_database_status.py

echo.
echo.
echo ====================================================================
echo CONSOLIDATION COMPLETE
echo ====================================================================
echo.
echo Next steps:
echo   1. Test your application thoroughly
echo   2. Verify all functionality works correctly
echo   3. Keep old databases for 1 week as backup
echo   4. After verification, drop old databases
echo.
echo Backup files are saved in: database_backups\
echo.
echo For detailed information, see: DATABASE_CONSOLIDATION_GUIDE.md
echo.

pause
