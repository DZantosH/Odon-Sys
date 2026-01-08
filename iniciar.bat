@echo off
echo Iniciando proyecto ODON-SYS completo...

:: Backend
echo [1/3] Iniciando Backend (Puerto 5000)...
start "Backend" cmd /k "cd /d %~dp0backend && npm start"

timeout /t 5 > nul

:: Frontend principal 
echo [2/3] Iniciando Frontend Principal (Puerto 3000)...
start "Frontend" cmd /k "cd /d %~dp0frontend && npm start"

timeout /t 3 > nul

:: Panel administrativo
echo [3/3] Iniciando Panel Administrativo (Puerto 3001)...
start "Admin Panel" cmd /k "cd /d %~dp0hk && npm start"

echo.
echo ===============================================
echo   ODON-SYS - Sistema Completo Iniciado
echo ===============================================
echo   Backend:          http://localhost:5000
echo   Frontend:         http://localhost:3000  
echo   Panel Admin:      http://localhost:3001
echo ===============================================
pause > nul