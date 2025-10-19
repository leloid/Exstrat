# API Transactions et Tokens - ExStrat

## 🚀 Nouvelles Fonctionnalités

### 1. **API Tokens (CoinMarketCap)**
- Recherche de tokens par symbole
- Recherche de tokens par nom
- Récupération d'informations détaillées d'un token

### 2. **API Transactions**
- Création de transactions manuelles
- Gestion complète du portfolio
- Calcul automatique des positions

## 📋 Endpoints Disponibles

### 🔍 **Tokens API**

#### Rechercher par symbole
```http
GET /tokens/search?symbol=BTC
Authorization: Bearer <jwt-token>
```

#### Rechercher par nom
```http
GET /tokens/search/name?query=bitcoin
Authorization: Bearer <jwt-token>
```

#### Récupérer un token par ID
```http
GET /tokens/1
Authorization: Bearer <jwt-token>
```

### 💰 **Transactions API**

#### Créer une transaction
```http
POST /transactions
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "symbol": "BTC",
  "name": "Bitcoin",
  "cmcId": 1,
  "quantity": 0.5,
  "amountInvested": 25000,
  "averagePrice": 50000,
  "type": "BUY",
  "transactionDate": "2024-01-15T10:30:00Z",
  "notes": "Achat lors du dip",
  "exchangeId": "binance"
}
```

#### Lister les transactions
```http
GET /transactions?symbol=BTC&type=BUY&page=1&limit=20
Authorization: Bearer <jwt-token>
```

#### Récupérer le portfolio
```http
GET /transactions/portfolio
Authorization: Bearer <jwt-token>
```

#### Mettre à jour une transaction
```http
PATCH /transactions/{id}
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "quantity": 0.75,
  "notes": "Mise à jour de la position"
}
```

#### Supprimer une transaction
```http
DELETE /transactions/{id}
Authorization: Bearer <jwt-token>
```

## 🏗️ **Types de Transactions**

- `BUY` - Achat
- `SELL` - Vente
- `TRANSFER_IN` - Transfert entrant
- `TRANSFER_OUT` - Transfert sortant
- `STAKING` - Staking
- `REWARD` - Récompense

## 📊 **Fonctionnalités du Portfolio**

### Calcul Automatique
- **Positions consolidées** par token
- **Prix moyen d'achat** calculé automatiquement
- **Montant total investi** par position
- **Quantité totale** détenue

### Gestion des Transactions
- **Historique complet** des transactions
- **Filtrage** par symbole, type, date
- **Pagination** pour de grandes listes
- **Notes** personnalisées

## 🔧 **Configuration**

### Variables d'Environnement
```env
# CoinMarketCap API
COINMARKETCAP_API_KEY="7740821c-5d41-4fef-b1ed-05d320d2b025"

# Base de données
DATABASE_URL="prisma+postgres://..."

# JWT
JWT_SECRET="your-secret-key"
```

## 🧪 **Tests**

### Test de l'API Tokens
```bash
# Rechercher Bitcoin
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/tokens/search?symbol=BTC"

# Rechercher par nom
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/tokens/search/name?query=ethereum"
```

### Test de l'API Transactions
```bash
# Créer une transaction
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC",
    "name": "Bitcoin",
    "cmcId": 1,
    "quantity": 0.1,
    "amountInvested": 5000,
    "averagePrice": 50000,
    "type": "BUY"
  }' \
  "http://localhost:3000/transactions"

# Récupérer le portfolio
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/transactions/portfolio"
```

## 📚 **Documentation Swagger**

Accédez à la documentation complète sur :
- **URL**: http://localhost:3000/api
- **Sections**: 
  - Authentication
  - Health Check
  - **Tokens** (nouveau)
  - **Transactions** (nouveau)

## 🎯 **Prochaines Étapes**

1. **Frontend** - Interface de saisie des transactions
2. **Recherche avancée** - Filtres multiples
3. **Export** - CSV/PDF du portfolio
4. **Graphiques** - Évolution des positions
5. **Alertes** - Notifications de prix

## 🚨 **Notes Importantes**

- **Authentification requise** pour tous les endpoints
- **Validation stricte** des données d'entrée
- **Gestion d'erreurs** complète
- **Rate limiting** sur l'API CoinMarketCap
- **Sécurité** - Vérification des permissions utilisateur
