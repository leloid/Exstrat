# Configuration Redis Cloud pour ExStrat

## 📋 Informations de votre compte Redis Cloud

Vous avez créé un compte Redis Cloud avec :

- **Database name** : `database-MJOY2U2E`
- **Public endpoint** : `redis-18592.crce202.eu-west-3-1.ec2.cloud.redislabs.com:18592`
- **Utilisateur default** : Mot de passe `HfBevVtOPwUe0X0ZvOAJBdI24hisfRRe`
- **Utilisateur API** : `production_admin` avec clé `S669bggny3oh6jeohgjypn5po67xfq5wovkyrq3fr3pw8lzau75`

## 🔧 Configuration dans le backend

### Option 1 : Utiliser l'URL complète (RECOMMANDÉ)

Ajoutez dans votre fichier `.env` :

```env
REDIS_URL=redis://default:HfBevVtOPwUe0X0ZvOAJBdI24hisfRRe@redis-18592.crce202.eu-west-3-1.ec2.cloud.redislabs.com:18592
```

**Format de l'URL** : `redis://username:password@host:port`

### Option 2 : Utiliser l'utilisateur API production_admin

Si vous préférez utiliser l'utilisateur API `production_admin` :

```env
REDIS_URL=redis://production_admin:S669bggny3oh6jeohgjypn5po67xfq5wovkyrq3fr3pw8lzau75@redis-18592.crce202.eu-west-3-1.ec2.cloud.redislabs.com:18592
```

### Option 3 : Configuration séparée

Si vous préférez séparer les paramètres :

```env
REDIS_HOST=redis-18592.crce202.eu-west-3-1.ec2.cloud.redislabs.com
REDIS_PORT=18592
REDIS_USERNAME=default
REDIS_PASSWORD=HfBevVtOPwUe0X0ZvOAJBdI24hisfRRe
```

## ✅ Test de connexion

### Test depuis le terminal

```bash
redis-cli -u redis://default:HfBevVtOPwUe0X0ZvOAJBdI24hisfRRe@redis-18592.crce202.eu-west-3-1.ec2.cloud.redislabs.com:18592
```

Une fois connecté, testez :
```redis
PING
# Devrait retourner: PONG

SET test "Hello Redis"
GET test
# Devrait retourner: "Hello Redis"
```

### Test depuis le backend

Le backend va automatiquement se connecter au démarrage. Vérifiez les logs :

```bash
cd exstrat_backend
npm run start:dev
```

Vous devriez voir des logs indiquant que Redis est connecté. Si vous voyez des erreurs de connexion, vérifiez :
1. Que l'URL est correcte dans `.env`
2. Que Redis Cloud est actif (vérifiez dans le dashboard)
3. Que le firewall/autorisations permettent la connexion

## 🔒 Sécurité

⚠️ **IMPORTANT** : 
- Ne commitez JAMAIS votre fichier `.env` avec les mots de passe
- Le fichier `.env` doit être dans `.gitignore`
- Utilisez des variables d'environnement en production

## 📊 Monitoring

Dans le dashboard Redis Cloud, vous pouvez :
- Voir l'utilisation de la mémoire
- Voir les connexions actives
- Voir les commandes exécutées
- Configurer des alertes

## 🚀 Prochaines étapes

Une fois Redis configuré, le système d'alertes va :
1. Se connecter automatiquement à Redis au démarrage
2. Utiliser Redis pour le cache des prix (TTL 60s)
3. Utiliser Redis pour les locks anti-doublon (TTL 5min)
4. Stocker les jobs BullMQ dans Redis

Vérifiez que tout fonctionne en regardant les logs au démarrage !


