# PowerShell script to start both ECHO servers
Write-Host "Starting ECHO AI Assistant..." -ForegroundColor Green

# Get the directory where this script is located
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendPath = Join-Path $ScriptDir "backend"
$FrontendPath = Join-Path $ScriptDir "echo-frontend-interface"

# Check if directories exist
if (-not (Test-Path $BackendPath)) {
    Write-Host "Error: Backend directory not found at $BackendPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $FrontendPath)) {
    Write-Host "Error: Frontend directory not found at $FrontendPath" -ForegroundColor Red
    exit 1
}

# Start backend in new PowerShell window
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
$BackendCommand = "Set-Location '$BackendPath'; python run.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $BackendCommand

# Wait for backend to start
Start-Sleep -Seconds 3

# Start frontend in new PowerShell window  
Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
$FrontendCommand = "Set-Location '$FrontendPath'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $FrontendCommand

Write-Host ""
Write-Host "Both servers are starting!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:8081" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan  
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")