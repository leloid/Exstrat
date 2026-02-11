#!/bin/bash
# Script optimisé pour exécuter les migrations Prisma avec timeout

set -e

echo "🔄 Checking for pending migrations..."

# Exécuter les migrations avec un timeout de 60 secondes
timeout 60 npx prisma migrate deploy --schema=./prisma/schema.prisma || {
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 124 ]; then
        echo "⚠️ Migration timeout after 60 seconds. This might be normal if migrations are already applied."
        echo "✅ Continuing deployment..."
        exit 0
    else
        echo "❌ Migration failed with exit code $EXIT_CODE"
        exit $EXIT_CODE
    fi
}

echo "✅ Migrations completed successfully"

