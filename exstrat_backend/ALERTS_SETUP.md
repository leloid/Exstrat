# Configuration du Système d'Alertes

## 📋 Vue d'ensemble

Le système d'alertes permet de :
- Vérifier automatiquement les prix des tokens toutes les 60 secondes
- Comparer avec les target prices (TP) des stratégies et alertes
- Envoyer des emails via Resend quand un TP est atteint
- Éviter les doublons grâce à un système de lock Redis

## 🏗️ Architecture

```
Cron Job (60s) → Price Checker Scheduler
    ↓
BullMQ Queue (price-check)
    ↓
Price Processor → PriceService (cache Redis)
    ↓
AlertService (lock Redis)
    ↓
BullMQ Queue (send-email)
    ↓
Email Processor → EmailService (Resend)
```

## 🔧 Configuration

### 1. Variables d'environnement

Ajoutez ces variables dans votre `.env` :

```env
# Redis
REDIS_URL=redis://localhost:6379
# Ou pour Redis Cloud/Upstash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password

# Resend (pour les emails)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@exstrat.com
```

### 2. Installation de Redis

**Option 1 : Redis local (développement)**
```bash
# macOS
brew install redis
brew services start redis

# Linux
sudo apt-get install redis-server
sudo systemctl start redis
```

**Option 2 : Redis Cloud (production)**
- Créez un compte sur [Redis Cloud](https://redis.com/try-free/)
- Créez une base de données
- Copiez l'URL de connexion dans `REDIS_URL`

### 3. Configuration Resend

1. Créez un compte sur [Resend](https://resend.com)
2. Générez une API key
3. Vérifiez votre domaine (ou utilisez le domaine de test)
4. Ajoutez l'API key dans `RESEND_API_KEY`

## 🚀 Démarrage

Le système démarre automatiquement avec l'application NestJS. Le cron job s'exécute toutes les 60 secondes.

### Vérification

Les logs vous indiqueront :
- `Starting scheduled price check...` - Le cron job démarre
- `Found X unique tokens with active alerts` - Tokens trouvés
- `Processing price check for X tokens` - Traitement en cours
- `Target price reached for strategy...` - Alerte déclenchée
- `Strategy alert email sent successfully` - Email envoyé

## 📊 Monitoring

### BullMQ Dashboard (optionnel)

Pour visualiser les queues, installez Bull Board :

```bash
npm install @bull-board/express @bull-board/api
```

Puis ajoutez dans `main.ts` :

```typescript
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullAdapter(priceCheckQueue),
    new BullAdapter(emailQueue),
  ],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());
```

Accédez à `http://localhost:3000/admin/queues` pour voir les queues.

## 🔍 Dépannage

### Les emails ne sont pas envoyés

1. Vérifiez `RESEND_API_KEY` dans `.env`
2. Vérifiez les logs pour les erreurs Resend
3. Vérifiez que le domaine est vérifié dans Resend

### Les prix ne sont pas vérifiés

1. Vérifiez la connexion Redis : `redis-cli ping` (doit retourner `PONG`)
2. Vérifiez `COINMARKETCAP_API_KEY` dans `.env`
3. Vérifiez les logs pour les erreurs de rate limit

### Les alertes se déclenchent plusieurs fois

Le système de lock Redis devrait empêcher cela. Vérifiez :
- Que Redis fonctionne correctement
- Les logs pour voir si les locks sont acquis

## 📝 Notes importantes

1. **Rate Limiting CoinMarketCap** : Le cache Redis (60s) réduit les appels API
2. **Lock anti-doublon** : 5 minutes de lock après déclenchement d'une alerte
3. **Batch processing** : Les tokens sont traités par batch de 100 (limite CoinMarketCap)
4. **Retry automatique** : BullMQ retry automatiquement les jobs en échec

## 🎯 Prochaines améliorations possibles

- Webhooks au lieu de polling
- Notifications push (Firebase)
- Notifications in-app (WebSocket)
- Multi-providers pour les prix (fallback automatique)


