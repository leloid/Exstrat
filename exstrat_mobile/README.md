# ExStrat Mobile

Application mobile React Native/Expo pour iOS et Android.

## Structure du projet

```
exstrat_mobile/
├── app/                  # Navigation (Expo Router)
│   ├── (auth)/          # Pages d'authentification
│   ├── (tabs)/          # Pages principales avec navigation par onglets
│   └── onboarding/      # Onboarding
│
├── components/          # Composants réutilisables
│   ├── ui/             # Composants UI de base
│   └── layout/         # Composants de layout
│
├── contexts/           # Contextes React (Auth, Portfolio, Theme)
│
├── lib/                # Utilitaires et API
│   ├── api.ts         # Instance Axios configurée
│   ├── format.ts      # Fonctions de formatage
│   ├── utils.ts       # Utilitaires généraux
│   ├── portfolios-api.ts
│   ├── transactions-api.ts
│   └── strategies-api.ts
│
├── types/              # Types TypeScript
│   ├── auth.ts
│   ├── portfolio.ts
│   ├── transactions.ts
│   └── strategies.ts
│
└── assets/             # Ressources
    ├── images/        # Images
    └── logos/         # Logos ExStrat
```

## Installation

```bash
npm install
```

## Configuration

1. Créer un fichier `.env` à la racine :
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

Pour la production, utiliser l'URL de votre backend déployé.

## Développement

```bash
# Démarrer le serveur de développement
npm start

# Lancer sur iOS
npm run ios

# Lancer sur Android
npm run android

# Lancer sur web (pour tester)
npm run web
```

## Dépendances principales

- **expo-router** : Navigation basée sur les fichiers
- **axios** : Client HTTP pour les appels API
- **@react-native-async-storage/async-storage** : Stockage local (remplace localStorage)
- **react-native-chart-kit** : Graphiques pour les données
- **react-native-svg** : Support SVG

## Partage de code avec le frontend web

Les fichiers suivants peuvent être partagés ou synchronisés avec `exstrat/src/` :

- `lib/api.ts` - Configuration Axios (adapté pour AsyncStorage)
- `lib/format.ts` - Fonctions de formatage
- `lib/utils.ts` - Utilitaires
- `types/*.ts` - Types TypeScript
- `lib/*-api.ts` - Appels API (structure similaire)

## Prochaines étapes

1. Créer les pages d'authentification (login, signup)
2. Implémenter la navigation principale
3. Créer les pages principales (dashboard, portfolio, transactions, strategies, config)
4. Adapter les composants UI pour React Native
5. Implémenter le thème dark/light
6. Ajouter les notifications push
