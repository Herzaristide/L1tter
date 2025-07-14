#!/bin/bash

# L1tter Development Environment Setup Script
# Sets up the complete development environment with database

set -e

echo "🚀 Setting up L1tter development environment..."

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "backend" ]; then
    echo "❌ Please run this script from the L1tter project root directory"
    exit 1
fi

# Setup database first
echo "📊 Setting up database..."
./setup-db.sh

# Setup backend
echo "🔧 Setting up backend..."
cd backend

# Install dependencies
echo "📦 Installing backend dependencies..."
npm install

# Wait a bit more for database to be fully ready
echo "⏳ Waiting for database to be fully ready..."
sleep 5

# Run migrations
echo "🗃️  Running database migrations..."
npm run db:generate
npm run db:migrate

# Seed database
echo "🌱 Seeding database with sample data..."
npm run db:seed

cd ..

# Setup frontend
echo "🎨 Setting up frontend..."
cd frontend

# Install dependencies
echo "📦 Installing frontend dependencies..."
npm install

cd ..

echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "🚀 To start the application:"
echo "  Backend:  cd backend && npm run dev"
echo "  Frontend: cd frontend && npm start"
echo ""
echo "🌐 URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:3001"
echo "  Adminer:  http://localhost:8080"
echo ""
echo "👤 Sample login credentials:"
echo "  Email: john@example.com"
echo "  Password: password123"
