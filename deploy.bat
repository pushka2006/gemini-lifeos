@echo off
setlocal
echo ==========================================================
echo   Gemini LifeOS - Cloud Run Deployment Assistant
echo ==========================================================
powershell -ExecutionPolicy Bypass -File "%~dp0deploy.ps1"
pause
