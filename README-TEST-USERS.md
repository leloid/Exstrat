# Script de création d'utilisateurs de test

Ce script permet de créer 200 utilisateurs de test avec toutes les données nécessaires pour les tests de charge.

## Prérequis

- `curl` (généralement installé par défaut sur macOS/Linux)
- `jq` (installer via `brew install jq` sur macOS ou `apt-get install jq` sur Linux)
- `bc` (installer via `brew install bc` sur macOS ou `apt-get install bc` sur Linux)
- Backend accessible (par défaut: `http://localhost:3000`)

## Utilisation

```bash
# Utiliser l'URL par défaut (http://localhost:3000)
./create-test-users.sh

# Spécifier une URL personnalisée
./create-test-users.sh http://localhost:3000
./create-test-users.sh https://votre-backend.railway.app
```

## Ce que le script crée pour chaque utilisateur

1. **Utilisateur** : Email `testuser{N}@exstrat.com` avec mot de passe `TestPassword123!`
2. **Portfolio (Wallet)** : Portfolio par défaut nommé "Portfolio Principal"
3. **Token BTC** : 2 BTC ajoutés au portfolio
4. **Stratégie** : Stratégie active configurée pour le token BTC
5. **Prévision** : Prévision activée avec la stratégie appliquée
6. **Configuration d'alertes** : Configuration complète avec 3 Take Profit (TP) configurés

## Fichier de sortie

Le script génère un fichier `test-users.json` contenant toutes les informations de chaque utilisateur :

```json
[
  {
    "email": "testuser1@exstrat.com",
    "password": "TestPassword123!",
    "userId": "...",
    "accessToken": "...",
    "portfolioId": "...",
    "holdingId": "...",
    "tokenId": "...",
    "strategyId": "...",
    "forecastId": "...",
    "alertConfigId": "..."
  },
  ...
]
```

## Utilisation pour les tests de charge

Vous pouvez utiliser le fichier `test-users.json` pour vos tests de charge :

```javascript
// Exemple avec k6
import http from 'k6/http';
import { check } from 'k6';
import { SharedArray } from 'k6/data';

const users = new SharedArray('users', function () {
  return JSON.parse(open('./test-users.json'));
});

export default function () {
  const user = users[__VU % users.length];
  
  const headers = {
    'Authorization': `Bearer ${user.accessToken}`,
    'Content-Type': 'application/json',
  };
  
  const res = http.get('https://votre-api.com/portfolios', { headers });
  check(res, { 'status was 200': (r) => r.status == 200 });
}
```

## Notes importantes

- Le script inclut des délais entre les requêtes pour éviter de surcharger le serveur
- Les erreurs sont affichées mais n'arrêtent pas le processus (le script continue avec les autres utilisateurs)
- Le prix du BTC est fixé à 50,000 USD (vous pouvez le modifier dans le script si nécessaire)
- Les Take Profit sont configurés à +10%, +25% et +50% du prix d'achat

## Dépannage

### Erreur: "curl n'est pas installé"
Installez curl via votre gestionnaire de paquets.

### Erreur: "jq n'est pas installé"
- macOS: `brew install jq`
- Linux (Debian/Ubuntu): `sudo apt-get install jq`
- Linux (RedHat/CentOS): `sudo yum install jq`

### Erreur: "bc n'est pas installé"
- macOS: `brew install bc`
- Linux (Debian/Ubuntu): `sudo apt-get install bc`
- Linux (RedHat/CentOS): `sudo yum install bc`

### Le backend n'est pas accessible
Vérifiez que le backend est démarré et accessible à l'URL spécifiée.

### Erreurs lors de la création des holdings
Le script essaie plusieurs méthodes pour créer les holdings. Si cela échoue, vérifiez que :
- Le backend est correctement configuré
- La base de données est accessible
- Les migrations Prisma ont été exécutées

