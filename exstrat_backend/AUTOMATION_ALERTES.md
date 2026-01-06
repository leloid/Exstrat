# 🤖 Automatisation du Système d'Alertes

## ✅ État Actuel

Le système d'alertes est **déjà complètement automatisé** et fonctionnel ! 🎉

### 🔄 Fonctionnement Automatique

1. **Vérification périodique des prix** : Toutes les **60 secondes**, un cron job vérifie automatiquement les prix de tous les tokens avec des alertes actives
2. **Détection des target prices** : Dès qu'un target price est atteint, le système le détecte
3. **Envoi d'email unique** : Un email est envoyé **une seule fois** grâce à un système de lock Redis (5 minutes par défaut)
4. **Protection anti-doublon** : Impossible d'envoyer 2 fois le même email pour la même alerte

## 🏗️ Architecture Automatique

```
┌─────────────────────────────────────────────────────────┐
│  Cron Job (toutes les 60s)                              │
│  PriceCheckerScheduler.checkPrices()                     │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  BullMQ Queue: price-check                               │
│  Traitement par batch de 100 tokens                     │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  PriceProcessor.handlePriceCheck()                      │
│  → PriceService.getBatchPrices() (cache Redis 60s)      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  AlertService.checkAlertsForToken()                     │
│  → Vérifie si target price atteint                     │
│  → Acquiert lock Redis (5 min) pour éviter doublons   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  BullMQ Queue: send-email                               │
│  Ajoute job d'envoi d'email                            │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  EmailProcessor.handleStrategyAlert()                   │
│  → EmailService.sendStrategyAlert()                    │
│  → Envoi via Resend                                    │
└─────────────────────────────────────────────────────────┘
```

## ⚙️ Configuration

### Variables d'environnement

Ajoutez ces variables dans votre `.env` pour personnaliser le comportement :

```env
# Intervalle de vérification des prix (en secondes)
# Défaut: 60 secondes
PRICE_CHECK_INTERVAL_SECONDS=60

# Durée du lock anti-doublon (en secondes)
# Défaut: 300 secondes (5 minutes)
# Pendant ce temps, aucune nouvelle alerte ne sera envoyée pour la même cible
ALERT_LOCK_TTL_SECONDS=300

# Redis (obligatoire)
REDIS_URL=redis://localhost:6379
# Ou
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password

# Resend (obligatoire)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=contact@alert.exstrat.io

# CoinMarketCap (obligatoire)
COINMARKETCAP_API_KEY=your_api_key
```

### Exemples de configuration

**Vérification plus fréquente (30 secondes) :**
```env
PRICE_CHECK_INTERVAL_SECONDS=30
```

**Lock plus long (10 minutes) :**
```env
ALERT_LOCK_TTL_SECONDS=600
```

**Note** : Pour changer l'intervalle du cron, vous devez modifier manuellement la ligne `@Cron('*/60 * * * * *')` dans `price-checker.scheduler.ts`.

## 🚀 Démarrage

Le système démarre **automatiquement** avec votre backend NestJS. Aucune action manuelle requise !

### Vérification que le système est actif

1. **Vérifiez les logs au démarrage** :
```
✅ Price checker scheduler initialized - checking prices every 60 seconds
Alert lock TTL configured to 300 seconds (5 minutes)
```

2. **Vérifiez les logs toutes les 60 secondes** :
```
[PriceCheckerScheduler] Starting scheduled price check...
[PriceCheckerScheduler] Found X unique tokens with active alerts
[PriceProcessor] Processing price check for X tokens
```

3. **Quand une alerte est déclenchée** :
```
[AlertService] Target price reached for strategy X, step Y: $1234.56 >= $1200.00
[EmailProcessor] Processing strategy alert email for user X, strategy Y
[EmailService] Strategy alert email sent successfully to user@example.com
```

## 🔒 Protection Anti-Doublon

### Comment ça fonctionne

1. **Lock Redis unique** : Chaque alerte a une clé unique dans Redis
   - Pour les stratégies : `alert:lock:{userId}:{strategyId}:{stepId}`
   - Pour les TPAlerts : `alert:lock:tp:{userId}:{tpAlertId}`

2. **Durée du lock** : Par défaut **5 minutes** (300 secondes)
   - Pendant ce temps, même si le prix reste au-dessus du target, aucun nouvel email ne sera envoyé
   - Le lock expire automatiquement après 5 minutes

3. **Pourquoi 5 minutes ?**
   - Évite le spam si le prix oscille autour du target
   - Permet de renvoyer une alerte si le prix redescend puis remonte
   - Configurable via `ALERT_LOCK_TTL_SECONDS`

### Exemple de scénario

```
T=0s   : Prix atteint $1200 → Email envoyé ✅
T=30s  : Prix toujours $1200 → Lock actif, pas d'email ❌
T=60s  : Prix toujours $1200 → Lock actif, pas d'email ❌
T=300s : Lock expire
T=310s : Prix toujours $1200 → Nouveau check, mais prix déjà atteint
        (le système vérifie si le prix est toujours >= target)
```

## 📊 Monitoring

### Logs à surveiller

**Normal (système actif) :**
```
[PriceCheckerScheduler] Starting scheduled price check...
[PriceCheckerScheduler] Found 5 unique tokens with active alerts
[PriceProcessor] Processing price check for 5 tokens
[PriceProcessor] Completed price check for 5 tokens
```

**Alerte déclenchée :**
```
[AlertService] Target price reached for strategy abc123, step def456: $1234.56 >= $1200.00
[EmailProcessor] Processing strategy alert email for user xyz789, strategy abc123
[EmailService] Strategy alert email sent successfully to user@example.com. Resend ID: re_xxxxx
```

**Lock déjà actif (normal) :**
```
[AlertService] Lock already exists for alert:lock:xyz789:abc123:def456, skipping
```

**Erreurs à surveiller :**
```
[PriceCheckerScheduler] Error in scheduled price check: ...
[AlertService] Error checking alerts for token 1: ...
[EmailService] Error sending strategy alert email: ...
```

### Vérification manuelle

**Vérifier que Redis fonctionne :**
```bash
redis-cli ping
# Doit retourner: PONG
```

**Vérifier les locks actifs :**
```bash
redis-cli KEYS "alert:lock:*"
# Affiche tous les locks actifs
```

**Vérifier un lock spécifique :**
```bash
redis-cli GET "alert:lock:userId:strategyId:stepId"
# Retourne "1" si le lock existe, nil sinon
```

## 🎯 Fonctionnalités

### ✅ Ce qui est automatisé

- ✅ Vérification périodique des prix (toutes les 60s)
- ✅ Détection automatique des target prices atteints
- ✅ Envoi automatique d'emails via Resend
- ✅ Protection anti-doublon avec lock Redis
- ✅ Cache Redis pour optimiser les appels API
- ✅ Traitement par batch (100 tokens max)
- ✅ Retry automatique en cas d'erreur (BullMQ)

### 🔄 Flux complet

1. **Cron job** → Toutes les 60s, récupère les tokens avec alertes actives
2. **Queue price-check** → Traite les tokens par batch
3. **PriceService** → Récupère les prix (cache Redis 60s)
4. **AlertService** → Compare avec les target prices
5. **Lock Redis** → Vérifie si l'alerte a déjà été envoyée
6. **Queue send-email** → Ajoute le job d'envoi
7. **EmailService** → Envoie l'email via Resend

## 🛠️ Dépannage

### Le système ne vérifie pas les prix

1. Vérifiez que Redis est connecté :
   ```bash
   redis-cli ping
   ```

2. Vérifiez les logs au démarrage :
   ```
   ✅ Price checker scheduler initialized
   ```

3. Vérifiez qu'il y a des alertes actives dans la DB

### Les emails ne sont pas envoyés

1. Vérifiez `RESEND_API_KEY` dans `.env`
2. Vérifiez que le domaine est vérifié dans Resend
3. Vérifiez les logs pour les erreurs Resend

### Les alertes se déclenchent plusieurs fois

Le système de lock devrait empêcher cela. Vérifiez :
- Que Redis fonctionne correctement
- Les logs pour voir si les locks sont acquis
- La valeur de `ALERT_LOCK_TTL_SECONDS`

## 📝 Notes Importantes

1. **Le système est déjà actif** : Dès que le backend démarre, le cron job commence à tourner
2. **Pas besoin d'action manuelle** : Tout est automatisé
3. **Lock de 5 minutes** : Empêche les doublons pendant 5 minutes après le premier envoi
4. **Cache de 60 secondes** : Les prix sont mis en cache pour éviter trop d'appels API
5. **Batch de 100** : CoinMarketCap limite à 100 tokens par requête

## 🎉 Résumé

**Votre système d'alertes est déjà complètement automatisé !**

- ✅ Vérifie les prix toutes les 60 secondes
- ✅ Détecte automatiquement les target prices atteints
- ✅ Envoie un email unique (pas de doublon)
- ✅ Protection anti-spam avec lock Redis (5 minutes)

**Aucune action requise de votre part** - le système fonctionne automatiquement dès que le backend est démarré ! 🚀

