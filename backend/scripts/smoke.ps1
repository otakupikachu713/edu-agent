# scripts/smoke.ps1
# End-to-end smoke test: launch the built exe, hit API endpoints, shut down.
# Prerequisite: run .\scripts\build.ps1 first.

$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

$exePath = "dist\edu-agent-backend\edu-agent-backend.exe"
if (-not (Test-Path $exePath)) {
    Write-Host "==> Executable not found. Run .\scripts\build.ps1 first." -ForegroundColor Red
    exit 1
}

$port = 8799
$env:EDU_AGENT_PORT = "$port"
$baseUrl = "http://127.0.0.1:$port"

Write-Host "==> Launching backend exe on port $port" -ForegroundColor Cyan
$proc = Start-Process -FilePath $exePath -PassThru -WindowStyle Hidden

try {
    Write-Host "==> Waiting for server to be ready..." -ForegroundColor Cyan
    $ready = $false
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Milliseconds 500
        try {
            $r = Invoke-RestMethod -Uri "$baseUrl/health" -TimeoutSec 1
            if ($r.status -eq "ok") { $ready = $true; break }
        } catch { }
    }

    if (-not $ready) {
        Write-Host "==> Server did not become ready in 15 seconds" -ForegroundColor Red
        exit 1
    }
    Write-Host "    Server is up." -ForegroundColor Green

    $script:failures = 0

    function Assert-Endpoint {
        param($name, $url, $validator)
        try {
            $resp = Invoke-RestMethod -Uri $url -TimeoutSec 3
            if (& $validator $resp) {
                Write-Host "    [PASS] $name" -ForegroundColor Green
            } else {
                Write-Host "    [FAIL] $name (validator returned false)" -ForegroundColor Red
                $script:failures++
            }
        } catch {
            Write-Host "    [FAIL] $name ($_)" -ForegroundColor Red
            $script:failures++
        }
    }

    Write-Host "==> Running smoke checks" -ForegroundColor Cyan

    Assert-Endpoint "GET /" "$baseUrl/" {
        param($r); $null -ne $r.message
    }

    Assert-Endpoint "GET /health" "$baseUrl/health" {
        param($r); $r.status -eq "ok" -and $r.service -eq "edu-agent-backend"
    }

    Assert-Endpoint "GET /api/ping" "$baseUrl/api/ping" {
        param($r); $r.message -eq "pong"
    }

    Assert-Endpoint "GET /api/ping?echo=smoke" "$baseUrl/api/ping?echo=smoke" {
        param($r); $r.message -eq "pong" -and $r.echo -eq "smoke"
    }

    Write-Host ""
    if ($script:failures -eq 0) {
        Write-Host "==> All smoke checks passed!" -ForegroundColor Green
    } else {
        Write-Host "==> $script:failures check(s) failed" -ForegroundColor Red
        exit 1
    }
}
finally {
    Write-Host "==> Shutting down backend" -ForegroundColor Cyan
    if ($proc -and -not $proc.HasExited) {
        Stop-Process -Id $proc.Id -Force
    }
    Remove-Item Env:\EDU_AGENT_PORT -ErrorAction SilentlyContinue
}
