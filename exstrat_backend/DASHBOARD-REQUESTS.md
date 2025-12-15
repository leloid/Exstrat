# 📡 Requêtes API du Dashboard

Ce document liste toutes les requêtes API appelées par le frontend pour charger le dashboard d'un utilisateur.

## 🔄 Flux de chargement du dashboard

### 1. Initialisation (PortfolioContext)

Quand un utilisateur authentifié accède à l'application, le `PortfolioContext` charge automatiquement :

#### GET /portfolios
- **Description**: Récupère tous les portfolios de l'utilisateur
- **Authentification**: Requise (Bearer Token)
- **Réponse**: Array de `Portfolio`
- **Appelé par**: `PortfolioContext.loadPortfolios()`

#### GET /portfolios/:portfolioId/holdings
- **Description**: Récupère les holdings (tokens) du portfolio sélectionné
- **Authentification**: Requise (Bearer Token)
- **Réponse**: Array de `Holding`
- **Appelé par**: `PortfolioContext.loadHoldings(portfolioId)`
- **Note**: Appelé automatiquement quand un portfolio est sélectionné

### 2. Chargement du Dashboard (DashboardPage)

Quand l'utilisateur accède à la page `/dashboard`, les requêtes suivantes sont effectuées :

#### GET /portfolios/forecasts
- **Description**: Récupère toutes les prévisions de l'utilisateur
- **Authentification**: Requise (Bearer Token)
- **Réponse**: Array de `ForecastResponse`
- **Appelé par**: `DashboardPage.loadForecasts()`
- **Note**: Filtré par `portfolioId` si un portfolio spécifique est sélectionné

#### GET /portfolios/:portfolioId/holdings (si vue globale)
- **Description**: Si l'utilisateur sélectionne la vue globale, charge les holdings de tous les portfolios
- **Authentification**: Requise (Bearer Token)
- **Réponse**: Array de `Holding`
- **Appelé par**: `DashboardPage.loadGlobalHoldings()`
- **Note**: Peut utiliser un endpoint batch si disponible, sinon fait plusieurs requêtes individuelles

### 3. Composants optionnels

Ces requêtes sont effectuées par certains composants du dashboard, mais ne sont pas toujours nécessaires :

#### GET /configuration/alerts
- **Description**: Récupère toutes les configurations d'alertes actives
- **Authentification**: Requise (Bearer Token)
- **Réponse**: Array de `AlertConfiguration`
- **Appelé par**: `BlocC_TableauTokens.loadAlertData()`
- **Note**: Seulement si `portfolioId` est fourni

#### GET /portfolios/theoretical-strategies
- **Description**: Récupère toutes les stratégies théoriques de l'utilisateur
- **Authentification**: Requise (Bearer Token)
- **Réponse**: Array de `TheoreticalStrategyResponse`
- **Appelé par**: 
  - `BlocC_TableauTokens.loadAlertData()`
  - `BlocE_StrategiesPrevisions.loadStrategies()`
- **Note**: Utilisé pour afficher les informations de stratégie dans le tableau des tokens

## 📊 Résumé des requêtes par scénario

### Scénario 1: Utilisateur avec un portfolio (vue normale)

1. `GET /portfolios` - Chargement des portfolios
2. `GET /portfolios/:portfolioId/holdings` - Chargement des holdings du portfolio par défaut
3. `GET /portfolios/forecasts` - Chargement des prévisions
4. `GET /configuration/alerts` - Chargement des alertes (si portfolioId fourni)
5. `GET /portfolios/theoretical-strategies` - Chargement des stratégies (si portfolioId fourni)

**Total: 5 requêtes**

### Scénario 2: Utilisateur avec vue globale

1. `GET /portfolios` - Chargement des portfolios
2. `GET /portfolios/:portfolioId1/holdings` - Holdings du portfolio 1
3. `GET /portfolios/:portfolioId2/holdings` - Holdings du portfolio 2
4. ... (une requête par portfolio)
5. `GET /portfolios/forecasts` - Chargement des prévisions

**Total: 2 + N requêtes** (où N = nombre de portfolios)

### Scénario 3: Utilisateur sans portfolios

1. `GET /portfolios` - Retourne un tableau vide
2. Aucune autre requête n'est effectuée

**Total: 1 requête**

## 🔍 Détails des endpoints

### GET /portfolios

**Contrôleur**: `PortfoliosController.getPortfolios()`

**Réponse**:
```json
[
  {
    "id": "uuid",
    "name": "Mon Portfolio",
    "description": "Description",
    "isDefault": true,
    "userId": "uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### GET /portfolios/:portfolioId/holdings

**Contrôleur**: `PortfoliosController.getPortfolioHoldings()`

**Réponse**:
```json
[
  {
    "id": "uuid",
    "portfolioId": "uuid",
    "token": {
      "id": "uuid",
      "symbol": "BTC",
      "name": "Bitcoin",
      "logoUrl": "https://..."
    },
    "quantity": 1.5,
    "investedAmount": 50000,
    "averagePrice": 33333.33,
    "currentPrice": 35000,
    "currentValue": 52500,
    "profitLoss": 2500,
    "profitLossPercentage": 5.0
  }
]
```

### GET /portfolios/forecasts

**Contrôleur**: `PortfoliosController.getUserForecasts()`

**Réponse**:
```json
[
  {
    "id": "uuid",
    "portfolioId": "uuid",
    "portfolioName": "Mon Portfolio",
    "name": "Prévision Q1 2024",
    "appliedStrategies": {
      "tokenId1": "strategyId1"
    },
    "summary": {
      "totalInvested": 100000,
      "totalCollected": 20000,
      "totalProfit": 5000,
      "returnPercentage": 5.0,
      "remainingTokensValue": 85000,
      "tokenCount": 10
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### GET /configuration/alerts

**Contrôleur**: `ConfigurationController.getAlertConfigurations()`

**Réponse**:
```json
[
  {
    "id": "uuid",
    "forecastId": "uuid",
    "isActive": true,
    "tokenAlerts": [
      {
        "id": "uuid",
        "holdingId": "uuid",
        "strategyId": "uuid",
        "isActive": true,
        "tpAlerts": [...]
      }
    ]
  }
]
```

### GET /portfolios/theoretical-strategies

**Contrôleur**: `PortfoliosController.getTheoreticalStrategies()`

**Réponse**:
```json
[
  {
    "id": "uuid",
    "name": "DCA + Take Profit",
    "description": "...",
    "steps": [...],
    "userId": "uuid"
  }
]
```

## ⚡ Optimisations possibles

1. **Endpoint batch pour holdings**: Au lieu de faire N requêtes pour N portfolios, utiliser un endpoint `/portfolios/holdings/batch` qui accepte un array de portfolioIds
2. **Cache côté client**: Mettre en cache les portfolios et stratégies qui changent rarement
3. **Requêtes parallèles**: Charger les prévisions et les alertes en parallèle
4. **Pagination**: Si un utilisateur a beaucoup de portfolios/holdings, implémenter la pagination

## 🧪 Test de charge

Un script de test de charge est disponible : `load-test-dashboard.js`

Voir `LOAD-TEST-README.md` pour plus d'informations.

