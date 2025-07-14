@echo off
REM Script to manage L1tter database containers (Windows)

if "%1"=="start" (
    echo 🚀 Starting L1tter database containers...
    podman start l1tter-postgres l1tter-adminer
    echo ✅ Containers started!
    goto end
)

if "%1"=="stop" (
    echo 🛑 Stopping L1tter database containers...
    podman stop l1tter-postgres l1tter-adminer
    echo ✅ Containers stopped!
    goto end
)

if "%1"=="restart" (
    echo 🔄 Restarting L1tter database containers...
    podman restart l1tter-postgres l1tter-adminer
    echo ✅ Containers restarted!
    goto end
)

if "%1"=="status" (
    echo 📊 Container status:
    podman ps -a --filter name=l1tter
    goto end
)

if "%1"=="logs" (
    echo 📋 PostgreSQL logs:
    podman logs l1tter-postgres
    goto end
)

if "%1"=="connect" (
    echo 🔌 Connecting to PostgreSQL...
    podman exec -it l1tter-postgres psql -U l1tter_user -d l1tter_db
    goto end
)

if "%1"=="backup" (
    echo 💾 Creating database backup...
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
    for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
    set BACKUP_FILE=l1tter_backup_%mydate%_%mytime%.sql
    podman exec l1tter-postgres pg_dump -U l1tter_user l1tter_db > %BACKUP_FILE%
    echo ✅ Backup created: %BACKUP_FILE%
    goto end
)

if "%1"=="clean" (
    echo 🧹 Removing L1tter database containers and volumes...
    set /p "confirm=Are you sure? This will delete all data! (y/N): "
    if /i "%confirm%"=="y" (
        podman stop l1tter-postgres l1tter-adminer 2>nul
        podman rm l1tter-postgres l1tter-adminer 2>nul
        podman volume rm l1tter_postgres_data 2>nul
        podman network rm l1tter-network 2>nul
        echo ✅ Cleanup complete!
    ) else (
        echo ❌ Cleanup cancelled.
    )
    goto end
)

echo L1tter Database Management Script
echo.
echo Usage: %0 {start^|stop^|restart^|status^|logs^|connect^|backup^|clean}
echo.
echo Commands:
echo   start     - Start database containers
echo   stop      - Stop database containers
echo   restart   - Restart database containers
echo   status    - Show container status
echo   logs      - Show PostgreSQL logs
echo   connect   - Connect to PostgreSQL shell
echo   backup    - Create database backup
echo   clean     - Remove containers and volumes (WARNING: deletes data!)
echo.

:end
