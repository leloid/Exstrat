# 🚀 Script de Test de Charge - Dashboard

Ce script simule un test de charge pour mesurer les performances du dashboard lorsqu'un grand nombre d'utilisateurs chargent leur dashboard simultanément.

## 📋 Prérequis

1. **Node.js** installé (version 14 ou supérieure)
2. **Backend démarré** et accessible
3. **Un utilisateur de test** créé dans la base de données

## 📦 Installation

Le script utilise `axios` qui devrait déjà être dans les dépendances du backend. Si ce n'est pas le cas :

```bash
cd exstrat_backend
npm install axios
```

## 🎯 Utilisation

### Configuration de base

```bash
cd exstrat_backend
node load-test-dashboard.js
```

### Configuration avancée avec variables d'environnement

```bash
# Définir l'URL de l'API
export API_BASE_URL=http://localhost:3000

# Définir le nombre d'utilisateurs à simuler
export NUM_USERS=200

# Définir les identifiants de test
export TEST_EMAIL=test@example.com
export TEST_PASSWORD=test123456

# Lancer le test
node load-test-dashboard.js
```

Ou en une seule ligne :

```bash
API_BASE_URL=http://localhost:3000 NUM_USERS=200 TEST_EMAIL=test@example.com TEST_PASSWORD=test123456 node load-test-dashboard.js
```

## 📊 Requêtes simulées

Le script simule les requêtes suivantes pour chaque utilisateur :

1. **GET /portfolios** - Récupération de tous les portfolios de l'utilisateur
2. **GET /portfolios/:portfolioId/holdings** - Récupération des holdings du portfolio par défaut
3. **GET /portfolios/forecasts** - Récupération des prévisions
4. **GET /configuration/alerts** - Récupération des configurations d'alertes (optionnel)
5. **GET /portfolios/theoretical-strategies** - Récupération des stratégies théoriques (optionnel)

## 📈 Métriques mesurées

Le script calcule et affiche :

### Par utilisateur
- ✅ Taux de succès/échec
- ⏱️ Temps de chargement total du dashboard
- ⏱️ Temps minimum, maximum et moyen

### Par requête
- 📊 Nombre total de requêtes
- ✅ Taux de succès/échec
- ⏱️ Temps de réponse : minimum, maximum, moyenne, médiane, P95, P99
- 📊 Statistiques détaillées par endpoint

### Erreurs
- ❌ Nombre d'erreurs par type
- 📋 Détails des 10 premières erreurs

## 📝 Exemple de sortie

```
🚀 Démarrage du test de charge du dashboard

📊 Configuration:
   - API Base URL: http://localhost:3000
   - Nombre d'utilisateurs: 200
   - Email de test: test@example.com

🔐 Authentification de l'utilisateur de test...
✅ Authentification réussie

🔄 Lancement de 200 utilisateurs simultanés...

================================================================================
📈 RÉSULTATS DU TEST DE CHARGE
================================================================================

⏱️  Temps total du test: 45.32s
👥 Utilisateurs simulés: 200
✅ Utilisateurs réussis: 195 (97.50%)
❌ Utilisateurs échoués: 5 (2.50%)

📊 Statistiques des requêtes:
   - Total des requêtes: 1000
   - Requêtes réussies: 975 (97.50%)
   - Requêtes échouées: 25 (2.50%)

⏱️  Temps de réponse (par requête):
   - Minimum: 45ms
   - Maximum: 2340ms
   - Moyenne: 234.56ms
   - Médiane: 189ms
   - P95: 567ms
   - P99: 1234ms

⏱️  Temps de chargement du dashboard (par utilisateur):
   - Minimum: 234ms (0.23s)
   - Maximum: 3456ms (3.46s)
   - Moyenne: 1234.56ms (1.23s)

📊 Statistiques par endpoint:
--------------------------------------------------------------------------------

/portfolios:
   - Requêtes: 200
   - Temps min: 45ms
   - Temps max: 567ms
   - Temps moyen: 123.45ms
   - Erreurs: 0 (0.00%)

...
```

## 🔧 Dépannage

### Erreur d'authentification

Si vous obtenez une erreur d'authentification :

1. Vérifiez que le backend est démarré
2. Vérifiez que l'utilisateur de test existe dans la base de données
3. Vérifiez les identifiants (email/mot de passe)

### Erreurs de connexion

Si vous obtenez des erreurs de connexion :

1. Vérifiez que `API_BASE_URL` pointe vers le bon serveur
2. Vérifiez que le backend est accessible depuis votre machine
3. Vérifiez les paramètres CORS du backend

### Performance

Si les temps de réponse sont très élevés :

1. Vérifiez la charge du serveur
2. Vérifiez la connexion à la base de données
3. Vérifiez les logs du backend pour identifier les goulots d'étranglement

## 💡 Conseils

- Commencez avec un petit nombre d'utilisateurs (10-20) pour tester
- Augmentez progressivement le nombre d'utilisateurs
- Surveillez les logs du backend pendant le test
- Utilisez un environnement de test/staging, pas la production

## 📝 Notes

- Le script utilise le même token d'authentification pour tous les utilisateurs simulés
- Les requêtes sont lancées simultanément (pas de délai entre les utilisateurs)
- Le timeout par requête est de 30 secondes
- Les erreurs sont collectées et affichées à la fin du test

