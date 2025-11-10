# PowerShell script to fix all student portal navigation routes
# This script adds /student/ prefix to all navigate() calls

$files = Get-ChildItem -Path "c:\Users\sowmy\OneDrive\Desktop\cdoe-lsc-portal\CDOE TWO PORTAL\unified-portal\frontend\src\student-portal" -Recurse -Include *.jsx,*.js

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Fix navigate routes - add /student/ prefix if not already present
    $content = $content -replace "navigate\('/(dashboard|application|login|signup|forgot-password|otp-verification|reset-password)'", "navigate('/student/`$1'"
    $content = $content -replace "navigate\('/(application/[^']+)'", "navigate('/student/`$1'"
    $content = $content -replace "navigate\('/(dashboard/[^']+)'", "navigate('/student/`$1'"
    
    # Fix any double /student/student/ that might have been created
    $content = $content -replace "navigate\('/student/student/", "navigate('/student/"
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($file.Name)"
    }
}

Write-Host "`nAll student portal navigation routes have been fixed!"
