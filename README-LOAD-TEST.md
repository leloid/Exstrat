# Tests de charge - Dashboard

Ce dossier contient les scripts pour effectuer des tests de charge sur le dashboard avec plusieurs utilisateurs simultanés.

## Scripts disponibles

### 1. `load-test-dashboard.sh`
Script principal pour exécuter un test de charge avec N utilisateurs simultanés.

**Usage:**
```bash
# Utiliser 50 utilisateurs (par défaut)
./load-test-dashboard.sh

# Spécifier l'URL de l'API et le nombre d'utilisateurs
./load-test-dashboard.sh https://exstrat-production.up.railway.app 50
```

**Ce que fait le script:**
- Charge 50 utilisateurs depuis `test-users.json`
- Simule le chargement du dashboard pour chaque utilisateur simultanément
- Effectue les appels API suivants pour chaque utilisateur:
  1. `GET /portfolios` - Récupère les portfolios
  2. `GET /portfolios/:id/holdings` - Récupère les holdings
  3. `GET /portfolios/forecasts` - Récupère les prévisions
  4. `GET /portfolios/strategies` - Récupère les stratégies
- Mesure les temps de réponse pour chaque endpoint
- Génère un fichier de résultats JSON et un résumé texte

**Fichiers générés:**
- `load-test-results/results_YYYYMMDD_HHMMSS.json` - Résultats détaillés
- `load-test-results/summary_YYYYMMDD_HHMMSS.txt` - Résumé textuel

### 2. `analyze-load-test.sh`
Script pour analyser en détail les résultats d'un test de charge.

**Usage:**
```bash
# Analyser le dernier fichier de résultats
./analyze-load-test.sh

# Analyser un fichier spécifique
./analyze-load-test.sh load-test-results/results_20231214_120000.json
```

**Ce que fait le script:**
- Calcule les statistiques globales (moyenne, min, max)
- Calcule les percentiles (P50, P75, P90, P95, P99)
- Analyse les performances par endpoint
- Affiche la distribution des temps de réponse
- Identifie les utilisateurs avec des erreurs

## Prérequis

- `jq` - Pour parser le JSON
- `bc` - Pour les calculs mathématiques
- `curl` - Pour les requêtes HTTP
- Fichier `test-users.json` avec les utilisateurs de test

**Installation:**
```bash
# macOS
brew install jq bc

# Linux
sudo apt-get install jq bc
```

## Exemple d'utilisation complète

```bash
# 1. Créer les utilisateurs de test (si pas déjà fait)
./create-test-users.sh https://exstrat-production.up.railway.app

# 2. Lancer le test de charge avec 50 utilisateurs
./load-test-dashboard.sh https://exstrat-production.up.railway.app 50

# 3. Analyser les résultats
./analyze-load-test.sh
```

## Interprétation des résultats

### Temps de réponse
- **< 0.5s** : Excellent
- **0.5-1s** : Bon
- **1-2s** : Acceptable
- **2-5s** : Lent
- **> 5s** : Très lent

### Taux de succès
- **> 99%** : Excellent
- **95-99%** : Bon
- **90-95%** : Acceptable
- **< 90%** : Problématique

### Percentiles
- **P50 (médiane)** : 50% des requêtes sont plus rapides
- **P95** : 95% des requêtes sont plus rapides (important pour l'expérience utilisateur)
- **P99** : 99% des requêtes sont plus rapides (cas extrêmes)

## Recommandations

1. **Exécuter plusieurs tests** pour avoir une moyenne fiable
2. **Tester à différents moments** pour voir l'impact de la charge du serveur
3. **Surveiller les endpoints lents** et optimiser en priorité
4. **Vérifier les erreurs** et comprendre leur cause
5. **Comparer les résultats** avant et après optimisations

## Structure des résultats JSON

```json
{
  "userIndex": 0,
  "email": "user@example.com",
  "totalTime": 1.234,
  "avgTimePerCall": 0.308,
  "apiCalls": 4,
  "errors": 0,
  "endpoints": {
    "portfolios": {
      "time": 0.250,
      "httpCode": 200,
      "success": true
    },
    "holdings": {
      "time": 0.300,
      "httpCode": 200,
      "success": true
    },
    "forecasts": {
      "time": 0.280,
      "httpCode": 200,
      "success": true
    },
    "strategies": {
      "time": 0.404,
      "httpCode": 200,
      "success": true
    }
  }
}
```

## Dépannage

### Erreur: "jq n'est pas installé"
```bash
brew install jq  # macOS
sudo apt-get install jq  # Linux
```

### Erreur: "bc n'est pas installé"
```bash
brew install bc  # macOS
sudo apt-get install bc  # Linux
```

### Erreur: "test-users.json introuvable"
Exécutez d'abord `./create-test-users.sh` pour créer les utilisateurs de test.

### Les tests sont très lents
- Vérifiez la connexion réseau
- Vérifiez que le serveur backend est accessible
- Réduisez le nombre d'utilisateurs simultanés

### Beaucoup d'erreurs 401
Les tokens JWT peuvent avoir expiré. Recréez les utilisateurs avec `./create-test-users.sh`.


