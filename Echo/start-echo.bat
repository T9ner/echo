@echo off
echo Starting ECHO AI Assistant...
echo.

REM Start backend in a new window
echo Starting Backend Server...
start "ECHO Backend" cmd /k "cd backend && python run.py"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in a new window
echo Starting Frontend Server...
start "ECHO Frontend" cmd /k "cd echo-frontend-interface && npm run dev"

echo.
echo ✅ Both servers are starting!
echo 📱 Frontend: http://localhost:8081
echo 🔧 Backend: http://localhost:8000
echo 📚 API Docs: http://localhost:8000/docs
echo.
echo Press any key to close this window...
pause >nul