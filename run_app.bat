@echo off
echo Starting VisionTrack AI Services...

start "VisionTrack Backend (FastAPI)" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
start "VisionTrack Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo VisionTrack AI is starting up!
echo - Frontend UI:  http://localhost:5173
echo - Backend API:  http://localhost:8000
echo - API Docs:     http://localhost:8000/docs
echo.
