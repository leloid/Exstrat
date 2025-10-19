# API Portfolios - Configuration de Stratégies

## Vue d'ensemble

Cette API permet de gérer les portefeuilles, les avoirs de tokens, et de configurer des stratégies de trading personnalisées pour chaque token.

## Endpoints

### 🏦 Portfolios

#### Créer un portfolio
```http
POST /portfolios
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Mon Portfolio Principal",
  "description": "Portfolio pour mes investissements crypto",
  "isDefault": true
}
```

#### Lister les portfolios
```http
GET /portfolios
Authorization: Bearer <token>
```

#### Récupérer un portfolio
```http
GET /portfolios/:id
Authorization: Bearer <token>
```

#### Modifier un portfolio
```http
PUT /portfolios/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Nouveau nom",
  "description": "Nouvelle description"
}
```

#### Supprimer un portfolio
```http
DELETE /portfolios/:id
Authorization: Bearer <token>
```

### 💰 Holdings (Avoirs)

#### Lister les avoirs d'un portfolio
```http
GET /portfolios/:portfolioId/holdings
Authorization: Bearer <token>
```

#### Ajouter un avoir
```http
POST /portfolios/:portfolioId/holdings
Authorization: Bearer <token>
Content-Type: application/json

{
  "tokenId": "token_id_here",
  "quantity": 2.5,
  "investedAmount": 100000,
  "averagePrice": 40000,
  "currentPrice": 45000
}
```

#### Modifier un avoir
```http
PUT /portfolios/:portfolioId/holdings/:holdingId
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 3.0,
  "currentPrice": 47000
}
```

#### Supprimer un avoir
```http
DELETE /portfolios/:portfolioId/holdings/:holdingId
Authorization: Bearer <token>
```

### 📊 Stratégies Utilisateur

#### Créer une stratégie
```http
POST /portfolios/strategies
Authorization: Bearer <token>
Content-Type: application/json

{
  "portfolioId": "portfolio_id_here",
  "name": "Bullrun 2025 Q3",
  "description": "Stratégie optimiste pour Q3 2025",
  "status": "draft"
}
```

#### Lister les stratégies
```http
GET /portfolios/strategies
Authorization: Bearer <token>
```

#### Récupérer une stratégie
```http
GET /portfolios/strategies/:id
Authorization: Bearer <token>
```

#### Modifier une stratégie
```http
PUT /portfolios/strategies/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Nouveau nom",
  "status": "active"
}
```

#### Supprimer une stratégie
```http
DELETE /portfolios/strategies/:id
Authorization: Bearer <token>
```

### ⚙️ Configuration par Token

#### Configurer la stratégie d'un token
```http
POST /portfolios/strategies/:strategyId/token-configs
Authorization: Bearer <token>
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

#### Lister les configurations de tokens
```http
GET /portfolios/strategies/:strategyId/token-configs
Authorization: Bearer <token>
```

### 🎯 Templates

#### Lister les templates de stratégies
```http
GET /portfolios/templates/strategies
Authorization: Bearer <token>
```

#### Lister les templates de prises de profit
```http
GET /portfolios/templates/profit-taking
Authorization: Bearer <token>
```

### 🧮 Simulation

#### Lancer une simulation
```http
POST /portfolios/strategies/:strategyId/simulate
Authorization: Bearer <token>
```

## Modèles de données

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
  lastUpdated: Date;
  token: {
    id: string;
    symbol: string;
    name: string;
    logoUrl?: string;
  };
  currentValue?: number;
  profitLoss?: number;
  profitLossPercentage?: number;
}
```

### UserStrategy
```typescript
{
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  portfolio: {
    id: string;
    name: string;
  };
  tokenConfigsCount?: number;
}
```

### TokenStrategyConfiguration
```typescript
{
  id: string;
  holdingId: string;
  strategyTemplateId?: string;
  profitTakingTemplateId?: string;
  customProfitTakingRules?: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  holding: {
    id: string;
    quantity: number;
    investedAmount: number;
    averagePrice: number;
    token: {
      id: string;
      symbol: string;
      name: string;
    };
  };
  strategyTemplate?: {
    id: string;
    name: string;
    type: string;
  };
  profitTakingTemplate?: {
    id: string;
    name: string;
    rules: any;
  };
}
```

## Templates prédéfinis

### Templates de stratégies
- **Sans TP (défaut)** : Aucune prise de profit automatique
- **Prise de profit par pourcentage** : Vendre un pourcentage à des niveaux de prix spécifiques
- **DCA (Dollar Cost Averaging)** : Achat régulier pour lisser le prix moyen
- **Stratégie personnalisée** : Configuration manuelle des règles

### Templates de prises de profit
- **Détails** : Configuration détaillée des prises de profit
- **Prise de profit 25/50/75** : Vendre 25% à +50%, 50% à +100%, 75% à +200%
- **Prise de profit 10/20/30** : Vendre 10% à +25%, 20% à +50%, 30% à +100%
- **HODL** : Aucune vente, garder tous les tokens

## Tokens disponibles

Les tokens suivants sont pré-configurés :
- BTC (Bitcoin)
- ETH (Ethereum)
- SOL (Solana)
- ARB (Arbitrum)
- USDT (Tether)
- USDC (USD Coin)

## Exemple d'utilisation complète

1. **Créer un portfolio**
2. **Ajouter des avoirs** (tokens possédés)
3. **Créer une stratégie** pour le portfolio
4. **Configurer chaque token** avec une stratégie et des prises de profit
5. **Lancer une simulation** pour voir les résultats projetés

Cette API permet de reproduire exactement l'interface montrée dans l'image, avec la possibilité de configurer des stratégies personnalisées pour chaque token possédé.
