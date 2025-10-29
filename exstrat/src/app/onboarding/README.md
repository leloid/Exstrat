# Structure de l'Onboarding

Cette page a été réorganisée en plusieurs fichiers pour améliorer la maintenabilité.

## Structure des fichiers

```
onboarding/
├── page.tsx                    # Page principale (allégée)
├── types.ts                    # Types et interfaces
├── constants.ts                # Constantes (steps, exchanges)
└── components/
    ├── ProgressBar.tsx         # Barre de progression
    ├── ExchangeIcons.tsx       # Icônes des exchanges
    ├── PortfolioStep.tsx       # Étape Portfolio
    ├── ExchangeStep.tsx        # Étape Exchange
    ├── StrategyStep.tsx        # Étape Strategy
    ├── ConfigurationStep.tsx   # Étape Configuration
    ├── TransactionModal.tsx    # Modal pour ajouter/modifier transaction
    └── TransactionList.tsx     # Liste des transactions dans l'onboarding
```

## Organisation

- **types.ts** : Tous les types TypeScript (ProfitTarget, CreatedData, etc.)
- **constants.ts** : Données statiques (liste des steps, liste des exchanges)
- **components/** : Composants réutilisables pour chaque étape
- **page.tsx** : Composant principal qui orchestre les étapes et gère la navigation

Cette structure permet de :
- Réduire la taille du fichier principal
- Faciliter la maintenance
- Améliorer la réutilisabilité des composants
- Séparer les responsabilités

