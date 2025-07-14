#!/bin/bash

# Script to manage L1tter database containers

case "$1" in
    "start")
        echo "🚀 Starting L1tter database containers..."
        podman start l1tter-postgres l1tter-adminer
        echo "✅ Containers started!"
        ;;
    "stop")
        echo "🛑 Stopping L1tter database containers..."
        podman stop l1tter-postgres l1tter-adminer
        echo "✅ Containers stopped!"
        ;;
    "restart")
        echo "🔄 Restarting L1tter database containers..."
        podman restart l1tter-postgres l1tter-adminer
        echo "✅ Containers restarted!"
        ;;
    "status")
        echo "📊 Container status:"
        podman ps -a --filter name=l1tter
        ;;
    "logs")
        echo "📋 PostgreSQL logs:"
        podman logs l1tter-postgres
        ;;
    "connect")
        echo "🔌 Connecting to PostgreSQL..."
        podman exec -it l1tter-postgres psql -U l1tter_user -d l1tter_db
        ;;
    "backup")
        echo "💾 Creating database backup..."
        BACKUP_FILE="l1tter_backup_$(date +%Y%m%d_%H%M%S).sql"
        podman exec l1tter-postgres pg_dump -U l1tter_user l1tter_db > "$BACKUP_FILE"
        echo "✅ Backup created: $BACKUP_FILE"
        ;;
    "restore")
        if [ -z "$2" ]; then
            echo "❌ Please provide backup file: ./db-manage.sh restore backup_file.sql"
            exit 1
        fi
        echo "🔄 Restoring database from $2..."
        cat "$2" | podman exec -i l1tter-postgres psql -U l1tter_user -d l1tter_db
        echo "✅ Database restored!"
        ;;
    "clean")
        echo "🧹 Removing L1tter database containers and volumes..."
        read -p "Are you sure? This will delete all data! (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            podman stop l1tter-postgres l1tter-adminer 2>/dev/null || true
            podman rm l1tter-postgres l1tter-adminer 2>/dev/null || true
            podman volume rm l1tter_postgres_data 2>/dev/null || true
            podman network rm l1tter-network 2>/dev/null || true
            echo "✅ Cleanup complete!"
        else
            echo "❌ Cleanup cancelled."
        fi
        ;;
    *)
        echo "L1tter Database Management Script"
        echo ""
        echo "Usage: $0 {start|stop|restart|status|logs|connect|backup|restore|clean}"
        echo ""
        echo "Commands:"
        echo "  start     - Start database containers"
        echo "  stop      - Stop database containers"
        echo "  restart   - Restart database containers"
        echo "  status    - Show container status"
        echo "  logs      - Show PostgreSQL logs"
        echo "  connect   - Connect to PostgreSQL shell"
        echo "  backup    - Create database backup"
        echo "  restore   - Restore from backup file"
        echo "  clean     - Remove containers and volumes (WARNING: deletes data!)"
        echo ""
        exit 1
        ;;
esac
