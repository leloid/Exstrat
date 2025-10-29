# 🚀 ExStrat

**ExStrat** est une plateforme complète de gestion de stratégies crypto conçue pour optimiser vos gains lors du prochain cycle haussier (bull run).

## 📋 À propos

ExStrat vous permet de :
- 🏦 **Gérer vos portfolios** crypto de manière professionnelle
- 💰 **Suivre vos transactions** et calculer automatiquement vos positions
- 📈 **Créer des stratégies de prise de profit** personnalisées par token
- 🎯 **Configurer des prises de profit** avec des paliers automatiques
- 📊 **Simuler vos stratégies** avant de les appliquer

## ✨ Fonctionnalités

### Portfolios
- Création et gestion de plusieurs portfolios
- Calcul automatique des positions (quantité, prix moyen, montant investi)
- Synchronisation automatique avec les transactions
- Statistiques en temps réel

### Transactions
- Ajout manuel de transactions (BUY/SELL/TRANSFER)
- Recherche de tokens via CoinMarketCap
- Historique complet des transactions
- Calcul automatique des prix moyens pondérés

### Stratégies
- Création de stratégies de prise de profit personnalisées
- Templates prédéfinis (HODL, DCA, etc.)
- Configuration par token avec paliers personnalisés
- Simulation des résultats projetés

### Configuration
- Interface intuitive pour configurer les stratégies par token
- Visualisation des prises de profit
- Calcul automatique des rendements

## 🛠️ Stack Technique

### Frontend
- **Next.js 14** (App Router)
- **React 18** avec TypeScript
- **Tailwind CSS** pour le styling
- **Heroicons** pour les icônes

### Backend
- **NestJS** (Framework Node.js)
- **Prisma** (ORM)
- **PostgreSQL** (Base de données)
- **JWT** (Authentification)

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- npm ou yarn
- PostgreSQL (via Prisma Accelerate)

### Installation

```bash
# Cloner le repository
git clone https://github.com/votre-username/exstrat.git
cd exstrat

# Installer les dépendances
cd exstrat && npm install
cd ../exstrat_backend && npm install
```

### Configuration

1. **Backend** : Créer un fichier `.env` dans `exstrat_backend/`
```env
DATABASE_URL="votre_connection_string"
JWT_SECRET="votre_secret_jwt"
```

2. **Frontend** : Créer un fichier `.env.local` dans `exstrat/`
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

### Lancement

```bash
# Option 1: Scripts automatiques (recommandé)
./start-dev.sh

# Option 2: Lancement manuel
# Terminal 1 - Backend
cd exstrat_backend
npm run start:dev

# Terminal 2 - Frontend
cd exstrat
npm run dev
```

### URLs

- **Frontend** : http://localhost:3001
- **Backend API** : http://localhost:3000
- **Swagger** : http://localhost:3000/api

## 📖 Documentation

Pour plus de détails, consultez la [documentation complète](./docs/).

- **[Guide de développement](./docs/DEVELOPMENT.md)** - Setup, structure, DB
- **[Documentation API](./docs/API.md)** - Tous les endpoints disponibles
- **[Workflows](./docs/WORKFLOWS.md)** - Workflows utilisateur et techniques

## 🎯 Workflow Utilisateur

1. **Créer un portfolio** pour organiser vos investissements
2. **Ajouter des transactions** (BUY/SELL) qui alimentent automatiquement le portfolio
3. **Créer une stratégie** de prise de profit personnalisée
4. **Configurer chaque token** avec des paliers de prise de profit
5. **Simuler les résultats** avant d'activer la stratégie

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Ouvrir une issue pour signaler un bug
- Proposer une nouvelle fonctionnalité
- Soumettre une pull request

## 📝 Licence

Ce projet est sous licence MIT.

## 📞 Contact

Pour toute question ou suggestion, n'hésitez pas à ouvrir une issue sur GitHub.

---

**ExStrat** - Préparez votre Bull Run 🚀

