#!/bin/bash

# Script pour démarrer ExStrat en développement
# Usage: ./start-dev.sh

echo "🚀 Démarrage d'ExStrat..."

# Configuration des ports
BACKEND_PORT=3000
FRONTEND_PORT=3001

# Fonction pour tuer les processus sur les ports
kill_ports() {
    echo "🧹 Nettoyage des ports $BACKEND_PORT et $FRONTEND_PORT..."
    lsof -ti:$BACKEND_PORT,$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
    pkill -f "nest start" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    sleep 2
}

# Fonction pour vérifier si un port est libre
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "❌ Port $1 est occupé"
        return 1
    else
        echo "✅ Port $1 est libre"
        return 0
    fi
}

# Nettoyer les ports
kill_ports

# Vérifier que les ports sont libres
if ! check_port $BACKEND_PORT || ! check_port $FRONTEND_PORT; then
    echo "❌ Impossible de libérer les ports. Arrêt du script."
    exit 1
fi

# Démarrer le backend
echo "🔧 Démarrage du backend (port $BACKEND_PORT)..."
cd exstrat_backend
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances du backend..."
    npm install
fi
npm run start:dev &
BACKEND_PID=$!

# Attendre que le backend démarre
echo "⏳ Attente du démarrage du backend..."
sleep 8

# Vérifier que le backend fonctionne
if curl -s http://localhost:$BACKEND_PORT/health > /dev/null; then
    echo "✅ Backend démarré avec succès"
else
    echo "❌ Erreur: Backend n'a pas démarré correctement"
    echo "💡 Vérifiez que le backend est correctement configuré et que la base de données est accessible"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Démarrer le nouveau frontend
echo "🎨 Démarrage du nouveau frontend (port $FRONTEND_PORT)..."
cd ../exstrat_frontend
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances du frontend..."
    npm install
fi
PORT=$FRONTEND_PORT npm run dev &
FRONTEND_PID=$!

# Attendre que le frontend démarre
echo "⏳ Attente du démarrage du frontend..."
sleep 5

# Vérifier que le frontend fonctionne
if curl -s http://localhost:$FRONTEND_PORT > /dev/null; then
    echo "✅ Frontend démarré avec succès"
else
    echo "❌ Erreur: Frontend n'a pas démarré correctement"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "🎉 ExStrat est maintenant démarré !"
echo "📱 Frontend (nouveau): http://localhost:$FRONTEND_PORT"
echo "🔧 Backend API: http://localhost:$BACKEND_PORT"
echo "📚 Swagger: http://localhost:$BACKEND_PORT/api"
echo ""
echo "Pour arrêter les serveurs, appuyez sur Ctrl+C"

# Fonction de nettoyage à l'arrêt
cleanup() {
    echo ""
    echo "🛑 Arrêt des serveurs..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    kill_ports
    echo "✅ Serveurs arrêtés"
    exit 0
}

# Capturer Ctrl+C
trap cleanup SIGINT SIGTERM

# Attendre indéfiniment
wait
