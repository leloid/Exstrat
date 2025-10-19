# Frontend - Workflow Complet

## 🎯 Vue d'ensemble

Le frontend ExStrat implémente un workflow cohérent entre les transactions et les portfolios, permettant aux utilisateurs de :

1. **Phase 1** : Ajouter des transactions crypto
2. **Phase 2** : Voir automatiquement leurs portfolios mis à jour
3. **Phase 3** : Configurer des stratégies de trading personnalisées

## 🔄 Intégration Portfolio-Transaction

### Synchronisation automatique
- ✅ **Création automatique** : Un portfolio par défaut est créé lors de la première transaction
- ✅ **Mise à jour en temps réel** : Chaque transaction met à jour automatiquement les holdings
- ✅ **Cohérence des données** : Les quantités et prix moyens sont recalculés automatiquement

### Workflow utilisateur
1. **L'utilisateur ajoute une transaction BTC** → Portfolio "Principal" créé + Holding BTC ajouté
2. **L'utilisateur ajoute une transaction ETH** → Holding ETH ajouté au portfolio existant  
3. **L'utilisateur modifie une transaction** → Holdings recalculés automatiquement
4. **L'utilisateur va sur la page de configuration** → Voit ses holdings existants prêts pour la configuration

## 📱 Pages et Composants

### 1. Page des Transactions (`/transactions`)
- **TransactionForm** : Formulaire pour ajouter/modifier des transactions
- **TransactionList** : Liste des transactions avec actions (modifier/supprimer)
- **PortfolioSummary** : Résumé des portfolios et holdings (NOUVEAU)

### 2. Page des Stratégies (`/strategies`)
- **StrategyConfiguration** : Modal de configuration de stratégies par token
- **PortfolioSummary** : Affichage des positions disponibles pour configuration

### 3. Contexte Portfolio (`PortfolioContext`)
- Gestion centralisée des portfolios et holdings
- Synchronisation automatique avec les transactions
- API calls pour les portfolios

## 🛠️ Composants UI

### Composants Portfolio
- **PortfolioSummary** : Affichage des portfolios avec statistiques
- **PortfolioCard** : Carte individuelle de portfolio
- **HoldingCard** : Carte d'un holding (position)

### Composants Stratégies
- **StrategyConfiguration** : Modal de configuration de stratégies
- **StrategyForm** : Formulaire de création de stratégies
- **StrategyCard** : Carte d'affichage d'une stratégie

### Composants UI de base
- **Card, Button, Input, Badge** : Composants de base
- **Select, Label, Textarea** : Composants de formulaire
- **Toast** : Notifications

## 🔧 API Integration

### Fonctions Portfolio (`portfolios-api.ts`)
```typescript
// Portfolios
getPortfolios()
createPortfolio(data)
updatePortfolio(id, data)
deletePortfolio(id)

// Holdings
getPortfolioHoldings(portfolioId)
addHolding(portfolioId, data)
updateHolding(portfolioId, holdingId, data)
deleteHolding(portfolioId, holdingId)

// Stratégies
getUserStrategies()
createUserStrategy(data)
configureTokenStrategy(strategyId, data)

// Templates
getStrategyTemplates()
getProfitTakingTemplates()

// Synchronisation
syncPortfolios()
```

## 📊 Types TypeScript

### Types Portfolio
- `Portfolio` : Portfolio utilisateur
- `Holding` : Position dans un portfolio
- `Token` : Token crypto
- `UserStrategy` : Stratégie utilisateur
- `TokenStrategyConfiguration` : Configuration stratégie par token
- `StrategyTemplate` : Template de stratégie
- `ProfitTakingTemplate` : Template de prise de profit

### Types Transaction (existant)
- `TransactionResponse` : Transaction
- `CreateTransactionDto` : DTO de création
- `UpdateTransactionDto` : DTO de mise à jour

## 🎨 Design et UX

### Cohérence visuelle
- **Design system** cohérent avec Tailwind CSS
- **Composants réutilisables** pour une expérience uniforme
- **Responsive design** pour mobile et desktop

### Workflow intuitif
- **Navigation claire** entre les phases
- **Feedback visuel** pour les actions utilisateur
- **Gestion d'erreurs** avec messages explicites

## 🚀 Fonctionnalités

### Phase 1 - Transactions
- ✅ Ajout de transactions (BUY/SELL/TRANSFER)
- ✅ Modification et suppression de transactions
- ✅ Recherche et filtrage des transactions
- ✅ Affichage du résumé des portfolios

### Phase 2 - Portfolios (Automatique)
- ✅ Création automatique de portfolios
- ✅ Synchronisation en temps réel
- ✅ Calcul automatique des holdings
- ✅ Affichage des statistiques

### Phase 3 - Configuration de Stratégies
- ✅ Configuration par token
- ✅ Templates de stratégies prédéfinis
- ✅ Règles de prise de profit personnalisées
- ✅ Simulation de résultats

## 🔄 État et Gestion des Données

### Contexte Portfolio
```typescript
const {
  portfolios,           // Liste des portfolios
  currentPortfolio,     // Portfolio sélectionné
  holdings,            // Holdings du portfolio courant
  isLoading,           // État de chargement
  error,               // Erreurs
  createPortfolio,     // Actions
  updatePortfolio,
  deletePortfolio,
  setCurrentPortfolio,
  refreshPortfolios,
  refreshHoldings,
  syncPortfolios
} = usePortfolio();
```

### Synchronisation
- **Automatique** : Chaque transaction synchronise les portfolios
- **Manuelle** : Bouton "Synchroniser" pour forcer la mise à jour
- **En temps réel** : Les changements sont immédiatement visibles

## 📈 Prochaines étapes

1. **Simulation avancée** : Moteur de simulation plus sophistiqué
2. **Alertes** : Système d'alertes pour les stratégies
3. **Graphiques** : Visualisation des performances
4. **Export** : Export des données et rapports
5. **Mobile** : Application mobile native

## 🎉 Résultat

Le frontend offre maintenant un workflow complet et cohérent :
- **Phase 1** : L'utilisateur ajoute ses transactions
- **Phase 2** : Les portfolios se mettent à jour automatiquement
- **Phase 3** : L'utilisateur configure des stratégies sur ses avoirs existants

C'est exactement ce qui était demandé dans l'image : une interface pour configurer des stratégies sur les tokens possédés, avec une cohérence parfaite entre les transactions et les portfolios ! 🚀
