# 🔧 Guide de Développement - ExStrat

## 📋 Table des matières

- [Prérequis](#prérequis)
- [Structure du projet](#structure-du-projet)
- [Base de données](#base-de-données)
- [Configuration](#configuration)
- [Commandes utiles](#commandes-utiles)
- [Résolution de problèmes](#résolution-de-problèmes)

## 📋 Prérequis

- Node.js 18+
- npm ou yarn
- PostgreSQL (via Prisma Accelerate)

## 📁 Structure du Projet

```
exstrat/
├── exstrat/              # Frontend Next.js
│   ├── src/
│   │   ├── app/          # Pages Next.js (App Router)
│   │   ├── components/   # Composants React
│   │   │   ├── auth/     # Authentification
│   │   │   ├── layout/   # Sidebar, TopBar
│   │   │   ├── portfolio/ # Composants portfolio
│   │   │   ├── strategies/ # Composants stratégies
│   │   │   ├── transactions/ # Composants transactions
│   │   │   └── ui/       # Composants UI de base
│   │   ├── contexts/     # Contextes React (Auth, Portfolio, Theme)
│   │   ├── hooks/        # Hooks personnalisés
│   │   ├── lib/          # Utilitaires et API
│   │   └── types/        # Types TypeScript
│   └── package.json
├── exstrat_backend/      # Backend NestJS
│   ├── src/
│   │   ├── auth/         # Authentification (JWT)
│   │   ├── portfolios/   # Gestion des portfolios
│   │   ├── strategies/   # Gestion des stratégies
│   │   ├── transactions/ # Gestion des transactions
│   │   ├── tokens/      # Gestion des tokens (CoinMarketCap)
│   │   ├── prisma/      # Configuration Prisma
│   │   └── main.ts      # Point d'entrée
│   ├── prisma/
│   │   ├── schema.prisma # Schéma de base de données
│   │   └── migrations/   # Migrations
│   └── package.json
├── start-dev.sh          # Script de démarrage
├── stop-dev.sh           # Script d'arrêt
└── README.md             # Documentation principale
```

## 🗄️ Base de Données

### Modèle de données (Prisma)

#### Tables principales

**User**
- Gestion des utilisateurs et authentification

**Portfolio**
- Portfolios utilisateur (nom, description, portfolio par défaut)

**Holding**
- Positions dans les portfolios (quantité, prix moyen, montant investi)

**Transaction**
- Transactions utilisateur (BUY/SELL/TRANSFER)

**Token**
- Tokens crypto (symbole, nom, CMC ID)

**UserStrategy**
- Stratégies créées par l'utilisateur

**TokenStrategyConfiguration**
- Configuration de stratégie par token

**StrategyTemplate**
- Templates de stratégies prédéfinis

**ProfitTakingTemplate**
- Templates de prises de profit

**SimulationResult**
- Résultats de simulation de stratégies

### Migrations

```bash
cd exstrat_backend
npx prisma migrate dev
npx prisma generate
npx prisma db push
```

### Seeding

Les templates de stratégies et tokens sont automatiquement créés dans la base de données.

## ⚙️ Configuration

### Variables d'environnement Backend

Créer un fichier `.env` dans `exstrat_backend/` :

```env
DATABASE_URL="postgresql://user:pass@host:5432/exstrat"
JWT_SECRET="change-me-secure-secret"
ENCRYPTION_KEY="32-bytes-hex-ou-base64" # Optionnel
PORT=3000
```

### Variables d'environnement Frontend

Créer un fichier `.env.local` dans `exstrat/` :

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

## 🚀 Démarrage

### Option 1: Scripts automatiques (Recommandé)

```bash
# Démarrer tout l'environnement
./start-dev.sh

# Arrêter tout l'environnement
./stop-dev.sh
```

### Option 2: Démarrage manuel

```bash
# Terminal 1 - Backend
cd exstrat_backend
npm run start:dev

# Terminal 2 - Frontend
cd exstrat
npm run dev
```

### URLs de développement

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Swagger**: http://localhost:3000/api

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

## 📝 Commandes Utiles

### Nettoyer et réinstaller

```bash
# Nettoyer les node_modules
rm -rf exstrat/node_modules exstrat_backend/node_modules

# Réinstaller
cd exstrat && npm install
cd exstrat_backend && npm install
```

### Prisma

```bash
cd exstrat_backend

# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate dev

# Voir la base de données
npx prisma studio

# Push le schéma (développement uniquement)
npx prisma db push
```

### Linter

```bash
# Frontend
cd exstrat && npm run lint

# Backend
cd exstrat_backend && npm run lint
```

### Build

```bash
# Frontend
cd exstrat && npm run build

# Backend
cd exstrat_backend && npm run build
```

## 🐛 Résolution des Problèmes

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

### Problèmes de base de données

```bash
cd exstrat_backend

# Réinitialiser la base de données (ATTENTION: supprime toutes les données)
npx prisma migrate reset

# Réappliquer les migrations
npx prisma migrate dev
```

### Problèmes CORS

Vérifier que :
1. Le backend est démarré sur le port 3000
2. La variable `NEXT_PUBLIC_API_BASE_URL` dans le frontend pointe vers le bon backend
3. Les headers CORS sont correctement configurés dans NestJS

### Token JWT invalide

```bash
# Vérifier la variable JWT_SECRET dans .env
# Supprimer les cookies du navigateur
# Se reconnecter
```

## 🔄 Workflow de développement

### Synchronisation automatique

Le backend synchronise automatiquement les portfolios avec les transactions :

1. **Création automatique** : Un portfolio par défaut est créé lors de la première transaction
2. **Synchronisation en temps réel** : Chaque transaction met à jour automatiquement les holdings
3. **Cohérence des données** : Les quantités et prix moyens sont recalculés automatiquement

### Calculs automatiques

- **Prix moyen pondéré** : Calculé automatiquement lors de chaque transaction
- **Montant investi** : Somme de toutes les transactions d'achat
- **Valeur actuelle** : Quantité × Prix actuel du token
- **Profit/Perte** : Valeur actuelle - Montant investi

## 📊 Logs

### Logs Backend

Les logs du backend s'affichent dans le terminal où vous avez lancé `npm run start:dev`

### Logs Frontend

Ouvrir les DevTools du navigateur (F12) → Console

## 🧪 Tests

### Tests Backend

```bash
cd exstrat_backend
npm run test
npm run test:e2e
```

### Test API manuel

Le frontend inclut un composant de test API sur la page d'accueil pour diagnostiquer les problèmes de connexion.

## 📈 Prochaines étapes

Pour plus d'informations :
- **[Documentation API](./API.md)** - Tous les endpoints disponibles
- **[Workflows](./WORKFLOWS.md)** - Workflows utilisateur et techniques

