# 🚀 ExStrat - Guide de Développement

## 📋 Prérequis

- Node.js 18+ 
- npm ou yarn
- PostgreSQL (via Prisma Accelerate)

## 🛠️ Démarrage Rapide

### Option 1: Script Automatique (Recommandé)

```bash
# Démarrer tout l'environnement
./start-dev.sh

# Arrêter tout l'environnement
./stop-dev.sh
```

### Option 2: Démarrage Manuel

```bash
# Terminal 1 - Backend
cd exstrat_backend
npm run start:dev

# Terminal 2 - Frontend  
cd exstrat
npm run dev
```

## 🌐 URLs

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Swagger**: http://localhost:3000/api

## 🔧 Résolution des Problèmes de Ports

### Problème: "Port already in use"

```bash
# Solution rapide
./stop-dev.sh

# Ou manuellement
lsof -ti:3000,3001 | xargs kill -9
pkill -f "nest start"
pkill -f "next dev"
```

### Vérifier les ports occupés

```bash
# Voir tous les ports utilisés
lsof -i :3000 -i :3001

# Voir tous les processus Node.js
ps aux | grep node
```

## 📁 Structure du Projet

```
exstrat/
├── exstrat/              # Frontend Next.js
│   ├── src/
│   │   ├── app/          # Pages Next.js
│   │   ├── components/   # Composants React
│   │   ├── contexts/     # Contextes React
│   │   └── lib/          # Utilitaires
│   └── package.json
├── exstrat_backend/      # Backend NestJS
│   ├── src/
│   │   ├── auth/         # Authentification
│   │   ├── health/       # Health checks
│   │   └── prisma/       # Base de données
│   └── package.json
├── start-dev.sh          # Script de démarrage
└── stop-dev.sh           # Script d'arrêt
```

## 🔐 Authentification

### Créer un compte
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@exstrat.com",
    "password": "SecurePassword123!"
  }'
```

### Se connecter
```bash
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@exstrat.com",
    "password": "SecurePassword123!"
  }'
```

## 🐛 Debug

### Logs Backend
Les logs du backend s'affichent dans le terminal où vous avez lancé `npm run start:dev`

### Logs Frontend
Ouvrez les DevTools du navigateur (F12) → Console

### Test API
Le frontend inclut un composant de test API sur la page d'accueil pour diagnostiquer les problèmes de connexion.

## 📝 Commandes Utiles

```bash
# Nettoyer les node_modules
rm -rf exstrat/node_modules exstrat_backend/node_modules
npm install

# Rebuild Prisma
cd exstrat_backend
npx prisma generate
npx prisma db push

# Linter
cd exstrat && npm run lint
cd exstrat_backend && npm run lint
```

## 🚨 Problèmes Courants

1. **CORS Error**: Vérifiez que le backend est démarré sur le port 3000
2. **Port Occupé**: Utilisez `./stop-dev.sh` puis `./start-dev.sh`
3. **Base de données**: Vérifiez que Prisma Accelerate est configuré
4. **Token JWT**: Vérifiez la variable `JWT_SECRET` dans `.env`

## 📞 Support

En cas de problème, vérifiez :
1. Les logs dans les terminaux
2. La console du navigateur
3. Les variables d'environnement
4. La connexion réseau
