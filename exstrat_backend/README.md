# ExStrat Backend

Backend NestJS pour ExStrat - API REST pour la gestion de portfolios, transactions et stratégies crypto.

## Documentation

Pour la documentation complète du projet, consultez le [README principal](../../README.md), la [documentation API](../../docs/API.md) et le [guide de développement](../../docs/DEVELOPMENT.md).

## Démarrage rapide

```bash
npm install
npm run start:dev
```

Le backend sera disponible sur http://localhost:3000

**Swagger** : http://localhost:3000/api

## Structure

```
src/
├── auth/         # Authentification (JWT)
├── portfolios/   # Gestion des portfolios
├── strategies/   # Gestion des stratégies
├── transactions/ # Gestion des transactions
├── tokens/       # Gestion des tokens (CoinMarketCap)
└── prisma/       # Configuration Prisma
```

## Configuration

Créer un fichier `.env` :

```env
DATABASE_URL="votre_connection_string"
JWT_SECRET="votre_secret_jwt"
```

## Base de données

```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate dev

# Voir la base de données
npx prisma studio
```
