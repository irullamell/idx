# Extract cookies from Chrome for idx.google.com
# This script reads Chrome's cookie database

$chromeCookieDbPath = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Network\Cookies"

if (-not (Test-Path $chromeCookieDbPath)) {
    Write-Host "Chrome cookies database not found at: $chromeCookieDbPath"
    Write-Host "Make sure Chrome is installed and you've visited idx.google.com"
    exit 1
}

Write-Host "Please close Chrome completely before continuing..."
Write-Host "Press any key when Chrome is closed..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')

# Copy cookies DB to temp location (Chrome locks it)
$tempDb = "$env:TEMP\chrome_cookies_temp.db"
Copy-Item $chromeCookieDbPath $tempDb -Force

# You'll need to install SQLite or use a different method
Write-Host ""
Write-Host "=== MANUAL METHOD ==="
Write-Host "1. Install Cookie-Editor extension in Chrome"
Write-Host "2. Go to your IDX workspace: https://idx.google.com/vps123-56372918"
Write-Host "3. Click Cookie-Editor icon"
Write-Host "4. Click 'Export' → 'JSON'"
Write-Host "5. Save as cookies.json in this folder"
Write-Host ""
