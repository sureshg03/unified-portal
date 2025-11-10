# ============================================
# CDOE Two Portal - Database Setup Script
# ============================================
# This script sets up all three MySQL databases and runs migrations
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "CDOE TWO PORTAL - DATABASE SETUP" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Check if Python is available
Write-Host "Checking Python installation..." -ForegroundColor Yellow
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    Write-Host "Error: Python is not installed or not in PATH" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Python found: $($pythonCmd.Version)`n" -ForegroundColor Green

# Navigate to backend directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "Current directory: $(Get-Location)`n" -ForegroundColor Yellow

# Step 1: Install required Python package
Write-Host "Step 1: Installing pymysql..." -ForegroundColor Cyan
python -m pip install pymysql | Out-Null
Write-Host "✓ pymysql installed`n" -ForegroundColor Green

# Step 2: Run the migration script
Write-Host "Step 2: Running database setup and migrations..." -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

python migrate_all_databases.py

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n============================================" -ForegroundColor Green
    Write-Host "✓ DATABASE SETUP COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "============================================`n" -ForegroundColor Green
    
    Write-Host "All three databases have been created and migrated:" -ForegroundColor White
    Write-Host "  1. lsc_portal_db    - LSC Users & Django admin" -ForegroundColor Cyan
    Write-Host "  2. online_edu       - LSC Admins & Student Portal" -ForegroundColor Cyan
    Write-Host "  3. lsc_admindb      - Application Settings" -ForegroundColor Cyan
    
    Write-Host "`nYou can now:" -ForegroundColor Yellow
    Write-Host "  • Open MySQL Workbench to verify the databases" -ForegroundColor White
    Write-Host "  • Run: python manage.py runserver" -ForegroundColor White
    Write-Host "  • Create test users: python create_test_users.py`n" -ForegroundColor White
} else {
    Write-Host "`n============================================" -ForegroundColor Red
    Write-Host "✗ DATABASE SETUP FAILED" -ForegroundColor Red
    Write-Host "============================================`n" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
}

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
