# PowerShell script to start both ECHO servers
Write-Host "Starting ECHO AI Assistant..." -ForegroundColor Green

# Start backend in new PowerShell window
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location backend; py -3.12 run.py"

# Wait for backend to start
Start-Sleep -Seconds 3

# Start frontend in new PowerShell window  
Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location echo-frontend-interface; npm run dev"

Write-Host ""
Write-Host "Both servers are starting!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:8081" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan  
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan