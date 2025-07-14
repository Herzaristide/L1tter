@echo off
REM L1tter Health Check Script (Windows)
REM Checks if all services are running properly

echo 🏥 L1tter Health Check
echo =====================

REM Check Podman
where podman >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Podman: Installed
    set PODMAN_OK=true
) else (
    echo ❌ Podman: Not installed
    set PODMAN_OK=false
)

REM Check database container
if "%PODMAN_OK%"=="true" (
    podman ps | findstr "l1tter-postgres" >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ PostgreSQL Container: Running
        set DB_CONTAINER_OK=true
    ) else (
        echo ❌ PostgreSQL Container: Not running
        set DB_CONTAINER_OK=false
    )
) else (
    set DB_CONTAINER_OK=false
)

REM Check database connectivity
if "%DB_CONTAINER_OK%"=="true" (
    podman exec l1tter-postgres pg_isready -U l1tter_user -d l1tter_db >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ PostgreSQL: Ready and accepting connections
        set DB_OK=true
    ) else (
        echo ❌ PostgreSQL: Not ready
        set DB_OK=false
    )
) else (
    set DB_OK=false
)

REM Check Adminer container
if "%PODMAN_OK%"=="true" (
    podman ps | findstr "l1tter-adminer" >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Adminer Container: Running
    ) else (
        echo ❌ Adminer Container: Not running
    )
)

REM Check if backend is running (port 3001)
curl -s http://localhost:3001/api/health >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend API: Running (http://localhost:3001)
    set BACKEND_OK=true
) else (
    echo ❌ Backend API: Not running (http://localhost:3001)
    set BACKEND_OK=false
)

REM Check if frontend is running (port 3000)
curl -s http://localhost:3000 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Frontend: Running (http://localhost:3000)
    set FRONTEND_OK=true
) else (
    echo ❌ Frontend: Not running (http://localhost:3000)
    set FRONTEND_OK=false
)

echo.
echo 🌐 Service URLs:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:3001
echo   Adminer:  http://localhost:8080

echo.
if "%DB_OK%"=="true" if "%BACKEND_OK%"=="true" if "%FRONTEND_OK%"=="true" (
    echo 🎉 All services are healthy!
    exit /b 0
) else (
    echo ⚠️  Some services need attention:
    if "%DB_OK%"=="false" echo   - Start database: setup-db.bat
    if "%BACKEND_OK%"=="false" echo   - Start backend: cd backend ^&^& npm run dev
    if "%FRONTEND_OK%"=="false" echo   - Start frontend: cd frontend ^&^& npm start
    exit /b 1
)
