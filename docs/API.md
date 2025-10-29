# 📡 Documentation API - ExStrat

## 📋 Table des matières

- [Authentification](#authentification)
- [Portfolios](#portfolios)
- [Transactions](#transactions)
- [Tokens](#tokens)
- [Stratégies](#stratégies)
- [Templates](#templates)
- [Simulation](#simulation)

## 🔐 Authentification

**Base URL**: `/auth`

### Créer un compte

```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@exstrat.com",
  "password": "SecurePassword123!"
}
```

### Se connecter

```http
POST /auth/signin
Content-Type: application/json

{
  "email": "user@exstrat.com",
  "password": "SecurePassword123!"
}
```

**Réponse** : Cookie JWT httpOnly défini automatiquement

### Se déconnecter

```http
POST /auth/signout
Authorization: Bearer <jwt_token>
```

## 🏦 Portfolios

**Base URL**: `/portfolios`

Tous les endpoints nécessitent l'authentification via `Authorization: Bearer <jwt_token>`

### Créer un portfolio

```http
POST /portfolios
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Mon Portfolio Principal",
  "description": "Portfolio pour mes investissements crypto",
  "isDefault": true
}
```

### Lister les portfolios

```http
GET /portfolios
Authorization: Bearer <jwt_token>
```

### Récupérer un portfolio

```http
GET /portfolios/:id
Authorization: Bearer <jwt_token>
```

### Modifier un portfolio

```http
PUT /portfolios/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Nouveau nom",
  "description": "Nouvelle description"
}
```

### Supprimer un portfolio

```http
DELETE /portfolios/:id
Authorization: Bearer <jwt_token>
```

## 💰 Holdings (Avoirs)

**Base URL**: `/portfolios/:portfolioId/holdings`

### Lister les avoirs d'un portfolio

```http
GET /portfolios/:portfolioId/holdings
Authorization: Bearer <jwt_token>
```

**Réponse** :
```json
[
  {
    "id": "holding_id",
    "quantity": 2.5,
    "investedAmount": 5000,
    "averagePrice": 2000,
    "currentPrice": 2200,
    "currentValue": 5500,
    "profitLoss": 500,
    "profitLossPercentage": 10,
    "token": {
      "id": "token_id",
      "symbol": "ETH",
      "name": "Ethereum"
    }
  }
]
```

### Ajouter un avoir (manuel)

```http
POST /portfolios/:portfolioId/holdings
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "tokenId": "token_id_here",
  "quantity": 2.5,
  "investedAmount": 100000,
  "averagePrice": 40000,
  "currentPrice": 45000
}
```

> **Note** : En général, les holdings sont créés automatiquement via les transactions.

### Modifier un avoir

```http
PUT /portfolios/:portfolioId/holdings/:holdingId
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "quantity": 3.0,
  "currentPrice": 47000
}
```

### Supprimer un avoir

```http
DELETE /portfolios/:portfolioId/holdings/:holdingId
Authorization: Bearer <jwt_token>
```

## 📊 Transactions

**Base URL**: `/transactions`

> **IMPORTANT** : Les transactions synchronisent automatiquement les portfolios !

### Créer une transaction

```http
POST /transactions
Authorization: Bearer <jwt_token>
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
  "portfolioId": "portfolio_id"
}
```

**Types de transactions** :
- `BUY` - Achat
- `SELL` - Vente
- `TRANSFER_IN` - Transfert entrant
- `TRANSFER_OUT` - Transfert sortant

**Synchronisation automatique** :
- Crée un portfolio par défaut si n'existe pas
- Met à jour automatiquement les holdings
- Recalcule le prix moyen pondéré

### Lister les transactions

```http
GET /transactions?symbol=BTC&type=BUY&page=1&limit=20
Authorization: Bearer <jwt_token>
```

**Query Parameters** :
- `symbol` (optional) : Filtrer par symbole
- `type` (optional) : Filtrer par type
- `page` (optional) : Numéro de page
- `limit` (optional) : Limite par page

### Récupérer une transaction

```http
GET /transactions/:id
Authorization: Bearer <jwt_token>
```

### Modifier une transaction

```http
PATCH /transactions/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "quantity": 0.75,
  "notes": "Mise à jour de la position"
}
```

**Note** : La modification resynchronise automatiquement les portfolios.

### Supprimer une transaction

```http
DELETE /transactions/:id
Authorization: Bearer <jwt_token>
```

**Note** : La suppression resynchronise automatiquement les portfolios.

### Synchroniser tous les portfolios

```http
POST /transactions/sync-portfolios
Authorization: Bearer <jwt_token>
```

**Réponse** :
```json
{
  "message": "Portfolios synchronisés avec succès",
  "portfoliosCreated": 1,
  "holdingsUpdated": 5
}
```

## 🔍 Tokens

**Base URL**: `/tokens`

Intégration avec CoinMarketCap pour la recherche de tokens.

### Rechercher par symbole

```http
GET /tokens/search?symbol=BTC
Authorization: Bearer <jwt_token>
```

### Rechercher par nom

```http
GET /tokens/search/name?query=bitcoin
Authorization: Bearer <jwt_token>
```

### Récupérer un token par ID

```http
GET /tokens/:id
Authorization: Bearer <jwt_token>
```

## 📈 Stratégies

**Base URL**: `/strategies`

### Créer une stratégie

```http
POST /strategies
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Stratégie ETH 2025",
  "symbol": "ETH",
  "tokenName": "Ethereum",
  "cmcId": 1027,
  "baseQuantity": 5.0,
  "referencePrice": 1200.0,
  "steps": [
    {
      "targetType": "exact_price",
      "targetValue": 1550.0,
      "sellPercentage": 25.0,
      "notes": "Première sortie à 1550$"
    },
    {
      "targetType": "percentage_of_average",
      "targetValue": 200.0,
      "sellPercentage": 50.0,
      "notes": "Sortie à 200% du prix moyen"
    }
  ],
  "notes": "Stratégie de prise de profit progressive"
}
```

**Target Types** :
- `exact_price` : Prix exact en USD
- `percentage_of_average` : Pourcentage du prix moyen d'achat

### Lister les stratégies

```http
GET /strategies?symbol=ETH&status=active&page=1&limit=10
Authorization: Bearer <jwt_token>
```

**Query Parameters** :
- `symbol` (optional) : Filtrer par symbole
- `status` (optional) : Filtrer par statut (active, paused, completed)
- `page` (optional) : Numéro de page
- `limit` (optional) : Limite par page

### Récupérer une stratégie

```http
GET /strategies/:id
Authorization: Bearer <jwt_token>
```

### Récupérer les stratégies par token

```http
GET /strategies/token/:symbol
Authorization: Bearer <jwt_token>
```

### Résumé d'une stratégie

```http
GET /strategies/:id/summary
Authorization: Bearer <jwt_token>
```

**Réponse** :
```json
{
  "totalSteps": 3,
  "activeSteps": 3,
  "completedSteps": 0,
  "totalTokensToSell": 5.0,
  "remainingTokens": 0.0,
  "estimatedTotalProfit": 8750.0
}
```

### Mettre à jour une stratégie

```http
PATCH /strategies/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Stratégie ETH 2025 - Mise à jour",
  "status": "paused",
  "notes": "Stratégie mise en pause"
}
```

### Mettre à jour une étape

```http
PATCH /strategies/:strategyId/steps/:stepId
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "targetValue": 1600.0,
  "sellPercentage": 30.0,
  "notes": "Prix cible ajusté"
}
```

### Supprimer une stratégie

```http
DELETE /strategies/:id
Authorization: Bearer <jwt_token>
```

## ⚙️ Configuration par Token (Portfolios)

**Base URL**: `/portfolios/strategies/:strategyId/token-configs`

### Configurer la stratégie d'un token

```http
POST /portfolios/strategies/:strategyId/token-configs
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "holdingId": "holding_id_here",
  "strategyTemplateId": "template_id_here",
  "profitTakingTemplateId": "profit_template_id_here",
  "customProfitTakingRules": {
    "levels": [
      { "percentage": 25, "targetPrice": 1.5 },
      { "percentage": 50, "targetPrice": 2.0 }
    ]
  }
}
```

### Lister les configurations de tokens

```http
GET /portfolios/strategies/:strategyId/token-configs
Authorization: Bearer <jwt_token>
```

### Modifier une configuration

```http
PUT /portfolios/strategies/:strategyId/token-configs/:configId
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "strategyTemplateId": "new_template_id",
  "customProfitTakingRules": {...}
}
```

### Supprimer une configuration

```http
DELETE /portfolios/strategies/:strategyId/token-configs/:configId
Authorization: Bearer <jwt_token>
```

## 🎯 Templates

**Base URL**: `/portfolios/templates`

Endpoints publics (pas d'authentification requise)

### Lister les templates de stratégies

```http
GET /portfolios/templates/strategies
```

**Réponse** :
```json
[
  {
    "id": "template_id",
    "name": "Sans TP (défaut)",
    "type": "no_tp",
    "description": "Aucune prise de profit automatique",
    "isDefault": true
  }
]
```

**Templates disponibles** :
- Sans TP (défaut) : Aucune prise de profit automatique
- Prise de profit par pourcentage : Vendre à des niveaux spécifiques
- DCA (Dollar Cost Averaging) : Achat régulier
- Stratégie personnalisée : Configuration manuelle

### Lister les templates de prises de profit

```http
GET /portfolios/templates/profit-taking
```

**Templates disponibles** :
- Détails : Configuration détaillée
- Prise de profit 25/50/75 : Vendre 25% à +50%, 50% à +100%, 75% à +200%
- Prise de profit 10/20/30 : Vendre 10% à +25%, 20% à +50%, 30% à +100%
- HODL : Aucune vente

## 🧮 Simulation

**Base URL**: `/portfolios/strategies/:strategyId`

### Lancer une simulation

```http
POST /portfolios/strategies/:strategyId/simulate
Authorization: Bearer <jwt_token>
```

**Réponse** :
```json
{
  "totalInvested": 10000,
  "totalCurrentValue": 15000,
  "totalProjectedValue": 20000,
  "totalProfit": 10000,
  "returnPercentage": 100,
  "results": [
    {
      "level": 1,
      "targetPrice": 3000,
      "sellPercentage": 25,
      "sellQuantity": 1.25,
      "profit": 1000
    }
  ]
}
```

## 📊 Modèles de données

### Portfolio

```typescript
{
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  holdingsCount?: number;
}
```

### Holding

```typescript
{
  id: string;
  quantity: number;
  investedAmount: number;
  averagePrice: number;
  currentPrice?: number;
  currentValue?: number;
  profitLoss?: number;
  profitLossPercentage?: number;
  token: {
    id: string;
    symbol: string;
    name: string;
  };
}
```

### Transaction

```typescript
{
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  amountInvested: number;
  averagePrice: number;
  type: 'BUY' | 'SELL' | 'TRANSFER_IN' | 'TRANSFER_OUT';
  transactionDate: Date;
  notes?: string;
  portfolioId?: string;
}
```

### Strategy

```typescript
{
  id: string;
  name: string;
  symbol: string;
  baseQuantity: number;
  referencePrice: number;
  status: 'active' | 'paused' | 'completed';
  steps: StrategyStep[];
}
```

### StrategyStep

```typescript
{
  id: string;
  targetType: 'exact_price' | 'percentage_of_average';
  targetValue: number;
  targetPrice: number;
  sellPercentage: number;
  sellQuantity: number;
  state: 'pending' | 'triggered' | 'done';
  notes?: string;
}
```

## 🚨 Codes d'erreur

- `400` : Requête invalide (données manquantes ou incorrectes)
- `401` : Non authentifié (token manquant ou invalide)
- `403` : Accès refusé (pas les permissions)
- `404` : Ressource non trouvée
- `500` : Erreur serveur

## 📝 Notes importantes

1. **Synchronisation automatique** : Les transactions synchronisent automatiquement les portfolios
2. **Authentification** : Tous les endpoints (sauf templates) nécessitent un token JWT
3. **Headers requis** : `Authorization: Bearer <jwt_token>` et `Content-Type: application/json`
4. **Validation** : Toutes les données d'entrée sont validées strictement
5. **Précision** : Les montants sont en `Decimal` pour éviter les pertes de précision

## 🔗 Documentation Swagger

Pour une documentation interactive, accédez à :
- **URL** : http://localhost:3000/api (en développement)
- **Sections** : Tous les endpoints sont documentés avec exemples

