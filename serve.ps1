# Local preview server for the Beyond Token Count companion site.
# Usage: right-click → Run with PowerShell, or: powershell -File .\serve.ps1
$port = 8765
$root = $PSScriptRoot
Write-Host "Serving $root at http://localhost:$port/"
Write-Host "Open http://localhost:$port/  (Ctrl+C to stop)"
Set-Location $root
python -m http.server $port
