#!/bin/bash

# L1tter Database Setup Script for Podman
# This script sets up PostgreSQL database using Podman containers

set -e

echo "🐳 Setting up L1tter PostgreSQL database with Podman..."

# Check if podman is installed
if ! command -v podman &> /dev/null; then
    echo "❌ Podman is not installed. Please install Podman first."
    echo "Visit: https://podman.io/getting-started/installation"
    exit 1
fi

# Check if podman-compose is available
if ! command -v podman-compose &> /dev/null; then
    echo "⚠️  podman-compose not found. Installing docker-compose for podman..."
    
    # Install docker-compose if not available
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ docker-compose is required. Please install it:"
        echo "pip install docker-compose"
        exit 1
    fi
fi

# Create network if it doesn't exist
echo "📡 Creating network..."
podman network create l1tter-network 2>/dev/null || echo "Network already exists"

# Stop and remove existing containers
echo "🛑 Stopping existing containers..."
podman stop l1tter-postgres l1tter-adminer 2>/dev/null || true
podman rm l1tter-postgres l1tter-adminer 2>/dev/null || true

# Start PostgreSQL container
echo "🚀 Starting PostgreSQL container..."
podman run -d \
  --name l1tter-postgres \
  --network l1tter-network \
  -e POSTGRES_DB=l1tter_db \
  -e POSTGRES_USER=l1tter_user \
  -e POSTGRES_PASSWORD=l1tter_password \
  -e PGDATA=/var/lib/postgresql/data/pgdata \
  -p 5432:5432 \
  -v l1tter_postgres_data:/var/lib/postgresql/data \
  -v "$(pwd)/init.sql:/docker-entrypoint-initdb.d/init.sql:ro" \
  --restart unless-stopped \
  postgres:15-alpine

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Check if PostgreSQL is ready
for i in {1..30}; do
    if podman exec l1tter-postgres pg_isready -U l1tter_user -d l1tter_db; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    echo "Waiting for PostgreSQL... ($i/30)"
    sleep 2
done

# Start Adminer (database admin interface)
echo "🎛️  Starting Adminer (database admin)..."
podman run -d \
  --name l1tter-adminer \
  --network l1tter-network \
  -p 8080:8080 \
  --restart unless-stopped \
  adminer:latest

echo ""
echo "🎉 Database setup complete!"
echo ""
echo "📊 Database Connection Details:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: l1tter_db"
echo "  Username: l1tter_user"
echo "  Password: l1tter_password"
echo ""
echo "🌐 Database Admin Interface:"
echo "  URL: http://localhost:8080"
echo "  System: PostgreSQL"
echo "  Server: l1tter-postgres"
echo "  Username: l1tter_user"
echo "  Password: l1tter_password"
echo "  Database: l1tter_db"
echo ""
echo "🔧 Next steps:"
echo "  1. Update your backend/.env file with the connection details"
echo "  2. Run: cd backend && npm run db:migrate"
echo "  3. Run: npm run db:seed"
echo ""
echo "📋 Useful commands:"
echo "  podman ps                     # List running containers"
echo "  podman logs l1tter-postgres   # View PostgreSQL logs"
echo "  podman exec -it l1tter-postgres psql -U l1tter_user -d l1tter_db  # Connect to database"
echo "  podman stop l1tter-postgres l1tter-adminer  # Stop containers"
echo "  podman start l1tter-postgres l1tter-adminer # Start containers"
