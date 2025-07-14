@echo off
REM L1tter Development Environment Setup Script (Windows)
REM Sets up the complete development environment with database

echo 🚀 Setting up L1tter development environment...

REM Check if we're in the right directory
if not exist "backend" (
    echo ❌ Please run this script from the L1tter project root directory
    exit /b 1
)

REM Setup database first
echo 📊 Setting up database...
call setup-db.bat

REM Setup backend
echo 🔧 Setting up backend...
cd backend

REM Install dependencies
echo 📦 Installing backend dependencies...
call npm install

REM Wait a bit more for database to be fully ready
echo ⏳ Waiting for database to be fully ready...
timeout /t 10 /nobreak >nul

REM Run migrations
echo 🗃️  Running database migrations...
call npm run db:generate
call npm run db:migrate

REM Seed database
echo 🌱 Seeding database with sample data...
call npm run db:seed

cd ..

REM Setup frontend
echo 🎨 Setting up frontend...
cd frontend

REM Install dependencies
echo 📦 Installing frontend dependencies...
call npm install

cd ..

echo.
echo 🎉 Development environment setup complete!
echo.
echo 🚀 To start the application:
echo   Backend:  cd backend ^&^& npm run dev
echo   Frontend: cd frontend ^&^& npm start
echo.
echo 🌐 URLs:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:3001
echo   Adminer:  http://localhost:8080
echo.
echo 👤 Sample login credentials:
echo   Email: john@example.com
echo   Password: password123

pause
