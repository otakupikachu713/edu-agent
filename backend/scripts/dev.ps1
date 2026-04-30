# scripts/dev.ps1
# Start FastAPI backend in development mode with hot reload.
#
# Usage (from backend/ directory):
#   .\scripts\dev.ps1

$ErrorActionPreference = "Stop"

# Move to backend/ (parent of scripts/)
Set-Location (Split-Path -Parent $PSScriptRoot)

Write-Host "==> Starting EduAgent backend (dev mode)" -ForegroundColor Cyan
Write-Host "    URL:  http://localhost:8765" -ForegroundColor Gray
Write-Host "    Docs: http://localhost:8765/docs" -ForegroundColor Gray
Write-Host ""

uvicorn app.main:app --reload --host 127.0.0.1 --port 8765