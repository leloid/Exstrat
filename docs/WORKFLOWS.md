# 🔄 Workflows - ExStrat

## 📋 Table des matières

- [Workflow Utilisateur](#workflow-utilisateur)
- [Workflow Technique](#workflow-technique)
- [Synchronisation automatique](#synchronisation-automatique)

## 🎯 Workflow Utilisateur

### Vue d'ensemble

ExStrat suit un workflow en 4 étapes principales :

1. **Créer un portfolio** pour organiser vos investissements
2. **Ajouter des transactions** (BUY/SELL/TRANSFER) dans ce portfolio
3. **Créer des stratégies** de prise de profit personnalisées
4. **Configurer les stratégies par token** avec des paliers de prise de profit

### Étape 1 : Créer un Portfolio

1. L'utilisateur va sur `/portfolio`
2. Clique sur "Nouveau Portfolio"
3. Remplit le formulaire (nom, description, portfolio par défaut)
4. Le portfolio est créé et devient actif

**Résultat** : Un nouveau portfolio est disponible pour les transactions

### Étape 2 : Ajouter des Transactions

1. L'utilisateur va sur `/transactions`
2. Voit le résumé de son portfolio en haut
3. Clique sur "Ajouter une transaction"
4. Remplit les détails (token, quantité, prix, type, date)
5. La transaction est ajoutée et le portfolio est automatiquement mis à jour

**Exemple** :
- Transaction 1 : BUY 2 ETH à 2000€ → Portfolio mis à jour avec 2 ETH
- Transaction 2 : BUY 2 BTC à 50000€ → Portfolio mis à jour avec 2 BTC

**Résultat** : Les holdings sont automatiquement créés/mis à jour dans le portfolio

### Étape 3 : Créer une Stratégie

1. L'utilisateur va sur `/strategies`
2. Clique sur "Nouvelle stratégie"
3. Est redirigé vers `/strategies/create`
4. Remplit le formulaire :
   - Nom de la stratégie
   - Token cible
   - Quantité de base
   - Prix de référence
   - Paliers de prise de profit
5. La stratégie est créée et apparaît dans la liste

**Résultat** : Une stratégie personnalisée est disponible pour configuration

### Étape 4 : Configurer les Tokens

1. L'utilisateur va sur `/config`
2. Voit la liste de ses holdings (positions) dans tous ses portfolios
3. Pour chaque token, sélectionne une stratégie dans le dropdown
4. Le système calcule automatiquement :
   - Nombre de sorties (prises de profit)
   - Profit total projeté
   - Rendement projeté
5. Les configurations sont sauvegardées

**Résultat** : Chaque token a maintenant une stratégie active avec des paliers de prise de profit

## 🔄 Workflow Technique

### Synchronisation Transaction → Portfolio

#### Flux de données

```
Transaction (BUY 2 ETH à 2000€)
    ↓
POST /transactions
    ↓
Transaction créée en base
    ↓
syncTransactionWithPortfolio() appelé automatiquement
    ↓
1. Vérifie si un portfolio par défaut existe
   → Si non, crée "Principal"
2. Vérifie si le token existe
   → Si non, crée le token
3. Recalcule le holding :
   - Si holding n'existe pas → Crée
   - Si holding existe → Met à jour
   - Calcul prix moyen pondéré
   - Calcul montant investi total
    ↓
Portfolio mis à jour avec holding ETH (2 ETH, prix moyen: 2000€)
```

#### Calculs automatiques

**Prix moyen pondéré** :
```
nouveau_prix_moyen = (
  (quantité_actuelle × prix_moyen_actuel) + 
  (quantité_transaction × prix_transaction)
) / (quantité_actuelle + quantité_transaction)
```

**Montant investi** :
```
montant_investi = Σ(toutes les transactions BUY) - Σ(toutes les transactions SELL)
```

**Valeur actuelle** :
```
valeur_actuelle = quantité × prix_actuel_token
```

### Workflow Stratégie → Configuration

#### Flux de configuration

```
1. Création de stratégie (POST /strategies)
   → Stratégie créée (nom, token, paliers)
   
2. Configuration dans /config
   → Sélection stratégie pour holding
   → POST /portfolios/strategies/:id/token-configs
   
3. Simulation (POST /strategies/:id/simulate)
   → Calcul des résultats projetés
   → Affichage dans l'interface
   
4. Activation
   → Stratégie marquée comme "active"
   → Surveille les prix pour déclencher les paliers
```

## 📊 Exemple Concret Complet

### Portfolio "Principal"

**Création** :
- Nom: "Principal"
- Description: "Mon portfolio principal"
- Portfolio par défaut: Oui

**Transactions** :
1. BUY 2 ETH à 2000€ = 4000€ investi
2. BUY 2 BTC à 50000€ = 100000€ investi

**Holdings résultants** :
- 2 ETH (prix moyen: 2000€, valeur actuelle: 2200€)
- 2 BTC (prix moyen: 50000€, valeur actuelle: 52000€)

### Stratégie "Bullrun 2025"

**Création** :
- Nom: "Bullrun 2025"
- Token: ETH
- Quantité de base: 2 ETH
- Prix de référence: 2000€

**Configuration ETH** :
- Type: "Prise de profit par pourcentage"
- Paliers:
  - +50% (3000€) → Vendre 25% = 0.5 ETH
  - +100% (4000€) → Vendre 50% = 1 ETH
  - +200% (6000€) → Vendre 25% = 0.5 ETH

**Configuration BTC** :
- Type: "HODL"
- Aucune vente

**Résultat** :
- ETH: 3 sorties prévues, profit projeté calculé
- BTC: Stratégie HODL, aucun profit projeté

## 🔄 Synchronisation Automatique

### Création automatique de portfolio

**Quand** :
- Lors de la première transaction si aucun portfolio n'existe
- Le portfolio créé est automatiquement marqué comme "par défaut"

**Code backend** :
```typescript
// Dans le service Transaction
async createTransaction(dto) {
  // Crée la transaction
  const transaction = await this.prisma.transaction.create(...)
  
  // Synchronise automatiquement avec le portfolio
  await this.syncTransactionWithPortfolio(transaction)
  
  return transaction
}
```

### Mise à jour automatique des holdings

**Quand** :
- À chaque création de transaction
- À chaque modification de transaction
- À chaque suppression de transaction

**Actions** :
1. Recalcule le prix moyen pondéré
2. Met à jour la quantité
3. Met à jour le montant investi
4. Supprime le holding si quantité = 0

### Synchronisation manuelle

**Endpoint** :
```http
POST /transactions/sync-portfolios
```

**Usage** :
- Migrer les données existantes
- Forcer la resynchronisation de tous les portfolios
- Corriger des incohérences

## 🎯 Workflow Frontend

### Intégration Portfolio-Transaction

#### Contexte Portfolio

Le `PortfolioContext` gère :
- Liste des portfolios
- Portfolio actuellement sélectionné
- Holdings du portfolio courant
- Actions CRUD (create, update, delete)

#### Synchronisation Frontend

**Quand une transaction est créée** :
1. Transaction créée via API
2. `refreshPortfolios()` appelé automatiquement
3. Holdings recalculés côté backend
4. Interface mise à jour immédiatement

**Code** :
```typescript
const handleTransactionCreated = async () => {
  await createTransaction(data)
  await refreshPortfolios() // Synchronise automatiquement
  await refreshHoldings() // Met à jour les holdings
}
```

## 📱 Navigation et Pages

### Structure des pages

1. **`/dashboard`** - Vue d'ensemble (stats, actions rapides, top holdings)
2. **`/portfolio`** - Gestion des portfolios
3. **`/transactions`** - Liste et gestion des transactions
4. **`/strategies`** - Liste des stratégies créées
5. **`/strategies/create`** - Création/édition de stratégie
6. **`/config`** - Configuration des stratégies par token

### Workflow de navigation

```
Dashboard
  ↓
Portfolio (créer portfolio)
  ↓
Transactions (ajouter transactions)
  ↓
Strategies (créer stratégie)
  ↓
Config (configurer par token)
```

## 🔧 Prochaines étapes

1. **Simulation avancée** : Moteur de simulation plus sophistiqué
2. **Alertes** : Système d'alertes pour les stratégies
3. **Graphiques** : Visualisation des performances
4. **Export** : Export des données et rapports
5. **Mobile** : Application mobile native

