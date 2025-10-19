# 📈 API Strategies - ExStrat Backend

## 🎯 **Vue d'ensemble**

L'API Strategies permet de créer et gérer des stratégies de prise de profit (take profit) pour les tokens crypto détenus dans le portfolio.

## 🔧 **Endpoints Disponibles**

### **Base URL**: `/strategies`

---

## 📋 **1. Créer une Stratégie**

### `POST /strategies`

Crée une nouvelle stratégie de prise de profit pour un token.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
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
    },
    {
      "targetType": "exact_price",
      "targetValue": 3000.0,
      "sellPercentage": 25.0,
      "notes": "Sortie finale à 3000$"
    }
  ],
  "notes": "Stratégie de prise de profit progressive pour ETH"
}
```

**Response (201):**
```json
{
  "id": "cmg123456789",
  "userId": "cmg3lhy21000044fp5miye39a",
  "name": "ETH",
  "symbol": "ETH",
  "tokenName": "ETH",
  "cmcId": 0,
  "baseQuantity": 5.0,
  "referencePrice": 1200.0,
  "status": "active",
  "notes": "Stratégie de prise de profit progressive pour ETH",
  "steps": [
    {
      "id": "step1",
      "strategyId": "cmg123456789",
      "targetType": "exact_price",
      "targetValue": 1550.0,
      "targetPrice": 1550.0,
      "sellPercentage": 25.0,
      "sellQuantity": 1.25,
      "state": "pending",
      "notes": "Première sortie à 1550$",
      "createdAt": "2025-01-10T15:30:00Z",
      "updatedAt": "2025-01-10T15:30:00Z"
    }
  ],
  "createdAt": "2025-01-10T15:30:00Z",
  "updatedAt": "2025-01-10T15:30:00Z"
}
```

---

## 📋 **2. Lister les Stratégies**

### `GET /strategies`

Récupère toutes les stratégies de l'utilisateur avec filtres optionnels.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `symbol` (optional): Filtrer par symbole de token (ex: BTC, ETH)
- `status` (optional): Filtrer par statut (active, paused, completed)
- `page` (optional): Numéro de page (défaut: 1)
- `limit` (optional): Limite par page (défaut: 20)

**Exemple:**
```
GET /strategies?symbol=ETH&status=active&page=1&limit=10
```

**Response (200):**
```json
{
  "strategies": [
    {
      "id": "cmg123456789",
      "userId": "cmg3lhy21000044fp5miye39a",
      "name": "ETH",
      "symbol": "ETH",
      "tokenName": "ETH",
      "cmcId": 0,
      "baseQuantity": 5.0,
      "referencePrice": 1200.0,
      "status": "active",
      "notes": "Stratégie de prise de profit progressive pour ETH",
      "steps": [...],
      "createdAt": "2025-01-10T15:30:00Z",
      "updatedAt": "2025-01-10T15:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

---

## 📋 **3. Stratégies par Token**

### `GET /strategies/token/{symbol}`

Récupère les stratégies actives pour un token spécifique.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Exemple:**
```
GET /strategies/token/ETH
```

**Response (200):**
```json
[
  {
    "id": "cmg123456789",
    "userId": "cmg3lhy21000044fp5miye39a",
    "name": "ETH",
    "symbol": "ETH",
    "tokenName": "ETH",
    "cmcId": 0,
    "baseQuantity": 5.0,
    "referencePrice": 1200.0,
    "status": "active",
    "steps": [...],
    "createdAt": "2025-01-10T15:30:00Z",
    "updatedAt": "2025-01-10T15:30:00Z"
  }
]
```

---

## 📋 **4. Détails d'une Stratégie**

### `GET /strategies/{id}`

Récupère les détails complets d'une stratégie.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "id": "cmg123456789",
  "userId": "cmg3lhy21000044fp5miye39a",
  "name": "ETH",
  "symbol": "ETH",
  "tokenName": "ETH",
  "cmcId": 0,
  "baseQuantity": 5.0,
  "referencePrice": 1200.0,
  "status": "active",
  "notes": "Stratégie de prise de profit progressive pour ETH",
  "steps": [
    {
      "id": "step1",
      "strategyId": "cmg123456789",
      "targetType": "exact_price",
      "targetValue": 1550.0,
      "targetPrice": 1550.0,
      "sellPercentage": 25.0,
      "sellQuantity": 1.25,
      "state": "pending",
      "notes": "Première sortie à 1550$",
      "createdAt": "2025-01-10T15:30:00Z",
      "updatedAt": "2025-01-10T15:30:00Z"
    }
  ],
  "createdAt": "2025-01-10T15:30:00Z",
  "updatedAt": "2025-01-10T15:30:00Z"
}
```

---

## 📋 **5. Résumé d'une Stratégie**

### `GET /strategies/{id}/summary`

Récupère un résumé statistique d'une stratégie.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
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

---

## 📋 **6. Mettre à Jour une Stratégie**

### `PATCH /strategies/{id}`

Met à jour les informations générales d'une stratégie.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Stratégie ETH 2025 - Mise à jour",
  "status": "paused",
  "notes": "Stratégie mise en pause temporairement"
}
```

**Response (200):**
```json
{
  "id": "cmg123456789",
  "userId": "cmg3lhy21000044fp5miye39a",
  "name": "ETH",
  "symbol": "ETH",
  "tokenName": "ETH",
  "cmcId": 0,
  "baseQuantity": 5.0,
  "referencePrice": 1200.0,
  "status": "paused",
  "notes": "Stratégie mise en pause temporairement",
  "steps": [...],
  "createdAt": "2025-01-10T15:30:00Z",
  "updatedAt": "2025-01-10T16:00:00Z"
}
```

---

## 📋 **7. Mettre à Jour une Étape**

### `PATCH /strategies/{strategyId}/steps/{stepId}`

Met à jour une étape spécifique d'une stratégie.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "targetType": "exact_price",
  "targetValue": 1600.0,
  "sellPercentage": 30.0,
  "state": "pending",
  "notes": "Prix cible ajusté à 1600$"
}
```

**Response (200):**
```json
{
  "id": "step1",
  "strategyId": "cmg123456789",
  "targetType": "exact_price",
  "targetValue": 1600.0,
  "targetPrice": 1600.0,
  "sellPercentage": 30.0,
  "sellQuantity": 1.5,
  "state": "pending",
  "notes": "Prix cible ajusté à 1600$",
  "createdAt": "2025-01-10T15:30:00Z",
  "updatedAt": "2025-01-10T16:00:00Z"
}
```

---

## 📋 **8. Supprimer une Stratégie**

### `DELETE /strategies/{id}`

Supprime une stratégie et toutes ses étapes.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "message": "Stratégie supprimée avec succès"
}
```

---

## 🔧 **Types de Données**

### **TargetType**
- `exact_price`: Prix exact en USD
- `percentage_of_average`: Pourcentage du prix moyen d'achat

### **StrategyStatus**
- `active`: Stratégie active
- `paused`: Stratégie en pause
- `completed`: Stratégie terminée

### **StepState**
- `pending`: Étape en attente
- `triggered`: Étape déclenchée
- `done`: Étape terminée

---

## ⚠️ **Règles de Validation**

1. **Quantité de référence** : Ne peut pas dépasser la quantité détenue
2. **Pourcentages de vente** : La somme ne peut pas dépasser 100%
3. **Prix de référence** : Doit être positif
4. **Token** : L'utilisateur doit détenir le token pour créer une stratégie

---

## 🚀 **Exemples d'Utilisation**

### **Créer une stratégie simple (1 sortie)**
```bash
curl -X POST "http://localhost:3000/strategies" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "BTC Simple",
    "symbol": "BTC",
    "tokenName": "Bitcoin",
    "cmcId": 1,
    "baseQuantity": 0.1,
    "referencePrice": 50000,
    "steps": [
      {
        "targetType": "percentage_of_average",
        "targetValue": 50,
        "sellPercentage": 100,
        "notes": "Vendre tout à +50%"
      }
    ]
  }'
```

### **Créer une stratégie progressive (3 sorties)**
```bash
curl -X POST "http://localhost:3000/strategies" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ETH Progressive",
    "symbol": "ETH",
    "tokenName": "Ethereum",
    "cmcId": 1027,
    "baseQuantity": 10,
    "referencePrice": 2000,
    "steps": [
      {
        "targetType": "percentage_of_average",
        "targetValue": 25,
        "sellPercentage": 20,
        "notes": "Première sortie à +25%"
      },
      {
        "targetType": "percentage_of_average",
        "targetValue": 50,
        "sellPercentage": 30,
        "notes": "Deuxième sortie à +50%"
      },
      {
        "targetType": "percentage_of_average",
        "targetValue": 100,
        "sellPercentage": 50,
        "notes": "Sortie finale à +100%"
      }
    ]
  }'
```

---

## 🎯 **Intégration Frontend**

Cette API est conçue pour s'intégrer parfaitement avec l'interface utilisateur montrée dans l'image, permettant de :

1. **Créer des stratégies** avec plusieurs sorties
2. **Gérer les prix cibles** (exact ou pourcentage)
3. **Définir les quantités** à vendre pour chaque sortie
4. **Suivre l'état** des stratégies et étapes
5. **Calculer les profits** estimés

L'API est maintenant prête pour l'intégration frontend ! 🚀
