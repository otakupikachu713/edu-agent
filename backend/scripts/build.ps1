# scripts/build.ps1
# Build the standalone backend executable via PyInstaller.
#
# Output: backend/dist/edu-agent-backend/edu-agent-backend.exe

$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

Write-Host "==> Cleaning previous build artifacts" -ForegroundColor Cyan
if (Test-Path "build") { Remove-Item -Recurse -Force "build" }
if (Test-Path "dist")  { Remove-Item -Recurse -Force "dist" }

Write-Host "==> Running PyInstaller" -ForegroundColor Cyan
pyinstaller build.spec --clean --noconfirm

$exePath = "dist\edu-agent-backend\edu-agent-backend.exe"
if (Test-Path $exePath) {
    $size = (Get-ChildItem "dist\edu-agent-backend" -Recurse |
             Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host ""
    Write-Host "==> Build succeeded!" -ForegroundColor Green
    Write-Host ("    Executable: {0}" -f $exePath) -ForegroundColor Gray
    Write-Host ("    Total size: {0:N1} MB" -f $size) -ForegroundColor Gray
} else {
    Write-Host "==> Build FAILED: executable not found" -ForegroundColor Red
    exit 1
}