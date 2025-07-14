#!/bin/bash

# L1tter Health Check Script
# Checks if all services are running properly

echo "🏥 L1tter Health Check"
echo "====================="

# Check Podman
if ! command -v podman &> /dev/null; then
    echo "❌ Podman: Not installed"
    PODMAN_OK=false
else
    echo "✅ Podman: Installed"
    PODMAN_OK=true
fi

# Check database container
if [ "$PODMAN_OK" = true ]; then
    if podman ps | grep -q "l1tter-postgres"; then
        echo "✅ PostgreSQL Container: Running"
        DB_CONTAINER_OK=true
    else
        echo "❌ PostgreSQL Container: Not running"
        DB_CONTAINER_OK=false
    fi
else
    DB_CONTAINER_OK=false
fi

# Check database connectivity
if [ "$DB_CONTAINER_OK" = true ]; then
    if podman exec l1tter-postgres pg_isready -U l1tter_user -d l1tter_db &> /dev/null; then
        echo "✅ PostgreSQL: Ready and accepting connections"
        DB_OK=true
    else
        echo "❌ PostgreSQL: Not ready"
        DB_OK=false
    fi
else
    DB_OK=false
fi

# Check Adminer container
if [ "$PODMAN_OK" = true ]; then
    if podman ps | grep -q "l1tter-adminer"; then
        echo "✅ Adminer Container: Running"
    else
        echo "❌ Adminer Container: Not running"
    fi
fi

# Check if backend is running (port 3001)
if curl -s http://localhost:3001/api/health &> /dev/null; then
    echo "✅ Backend API: Running (http://localhost:3001)"
    BACKEND_OK=true
else
    echo "❌ Backend API: Not running (http://localhost:3001)"
    BACKEND_OK=false
fi

# Check if frontend is running (port 3000)
if curl -s http://localhost:3000 &> /dev/null; then
    echo "✅ Frontend: Running (http://localhost:3000)"
    FRONTEND_OK=true
else
    echo "❌ Frontend: Not running (http://localhost:3000)"
    FRONTEND_OK=false
fi

echo ""
echo "🌐 Service URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:3001"
echo "  Adminer:  http://localhost:8080"

echo ""
if [ "$DB_OK" = true ] && [ "$BACKEND_OK" = true ] && [ "$FRONTEND_OK" = true ]; then
    echo "🎉 All services are healthy!"
    exit 0
else
    echo "⚠️  Some services need attention:"
    if [ "$DB_OK" = false ]; then
        echo "  - Start database: ./setup-db.sh"
    fi
    if [ "$BACKEND_OK" = false ]; then
        echo "  - Start backend: cd backend && npm run dev"
    fi
    if [ "$FRONTEND_OK" = false ]; then
        echo "  - Start frontend: cd frontend && npm start"
    fi
    exit 1
fi
