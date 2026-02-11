#!/bin/bash
# Script optimisé pour vérifier et appliquer les migrations sans bloquer

set -e

echo "🔄 Checking database connection and migration status..."

# Vérifier rapidement si la base de données est accessible
timeout 10 npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1 || {
    echo "⚠️ Database connection check failed or timeout"
    echo "✅ Continuing deployment (migrations will be checked on startup if needed)"
    exit 0
}

# Vérifier le statut des migrations (rapide, ne bloque pas)
echo "📊 Checking migration status..."
MIGRATION_STATUS=$(timeout 30 npx prisma migrate status 2>&1 || echo "timeout")

if echo "$MIGRATION_STATUS" | grep -q "Database schema is up to date"; then
    echo "✅ Database schema is up to date, no migrations needed"
    exit 0
elif echo "$MIGRATION_STATUS" | grep -q "timeout"; then
    echo "⚠️ Migration check timeout, continuing deployment"
    exit 0
else
    echo "🔄 Applying pending migrations..."
    # Appliquer les migrations avec timeout
    timeout 60 npx prisma migrate deploy || {
        EXIT_CODE=$?
        if [ $EXIT_CODE -eq 124 ]; then
            echo "⚠️ Migration timeout after 60 seconds"
            echo "✅ Continuing deployment (migrations may be applied manually later)"
            exit 0
        else
            echo "❌ Migration failed with exit code $EXIT_CODE"
            exit $EXIT_CODE
        fi
    }
    echo "✅ Migrations applied successfully"
fi

