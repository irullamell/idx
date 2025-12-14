# Script to encode cookies.json to base64 for Render.com environment variables

Write-Host "=== Cookie Encoder for Render.com ===" -ForegroundColor Cyan
Write-Host ""

# Check if cookies.json exists
if (-not (Test-Path "cookies.json")) {
    Write-Host "Error: cookies.json not found!" -ForegroundColor Red
    Write-Host "Please run the app locally first to generate cookies:" -ForegroundColor Yellow
    Write-Host "  `$env:HEADLESS='false'" -ForegroundColor Yellow
    Write-Host "  node index-authenticated.js" -ForegroundColor Yellow
    exit 1
}

# Read cookies file
$cookiesContent = Get-Content .\cookies.json -Raw

# Encode to base64
$bytes = [System.Text.Encoding]::UTF8.GetBytes($cookiesContent)
$base64 = [Convert]::ToBase64String($bytes)

# Display result
Write-Host "✓ Cookies encoded successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Copy the following base64 string:" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Gray
Write-Host $base64 -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps for Render.com:" -ForegroundColor Cyan
Write-Host "1. Go to your Render.com service dashboard" -ForegroundColor White
Write-Host "2. Navigate to Environment tab" -ForegroundColor White
Write-Host "3. Add new environment variable:" -ForegroundColor White
Write-Host "   Name:  GOOGLE_COOKIES_BASE64" -ForegroundColor Yellow
Write-Host "   Value: [paste the base64 string above]" -ForegroundColor Yellow
Write-Host "4. Add your workspace URL:" -ForegroundColor White
Write-Host "   Name:  IDX_WORKSPACE_URL" -ForegroundColor Yellow
Write-Host "   Value: https://your-workspace.idx.google.com" -ForegroundColor Yellow
Write-Host "5. Save and redeploy" -ForegroundColor White
Write-Host ""

# Also save to clipboard if possible
try {
    $base64 | Set-Clipboard
    Write-Host "✓ Base64 string also copied to clipboard!" -ForegroundColor Green
} catch {
    Write-Host "Note: Could not copy to clipboard automatically" -ForegroundColor Yellow
}
