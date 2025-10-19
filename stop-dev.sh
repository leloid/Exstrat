#!/bin/bash

# Script pour arrêter ExStrat en développement
# Usage: ./stop-dev.sh

echo "🛑 Arrêt d'ExStrat..."

# Tuer tous les processus Node.js liés à ExStrat
echo "🧹 Arrêt des processus Node.js..."
pkill -f "nest start" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "exstrat" 2>/dev/null || true

# Libérer les ports
echo "🧹 Libération des ports 3000 et 3001..."
lsof -ti:3000,3001 | xargs kill -9 2>/dev/null || true

# Attendre un peu
sleep 2

# Vérifier que les ports sont libres
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 3000 encore occupé"
else
    echo "✅ Port 3000 libéré"
fi

if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 3001 encore occupé"
else
    echo "✅ Port 3001 libéré"
fi

echo "✅ ExStrat arrêté avec succès"
