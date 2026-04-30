# scripts/test.ps1
# Run the pytest suite.
#
# Usage:
#   .\scripts\test.ps1           # normal output
#   .\scripts\test.ps1 -v        # verbose (passed through to pytest)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

Write-Host "==> Running tests" -ForegroundColor Cyan
pytest $args