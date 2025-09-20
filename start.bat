@echo off
echo Starting PWA App...

echo Starting Django Backend...
start cmd /k "cd backend && python run.py"

timeout /t 3 /nobreak >nul

echo Starting Vue.js Frontend...
start cmd /k "cd frontend && npm run serve"

echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause >nul
