# 🔧 Résolution des Problèmes de Connexion PostgreSQL

## ❌ Erreur : "Connection reset by peer"

Cette erreur apparaît dans les logs PostgreSQL et indique que des connexions sont interrompues.

## 🔍 Causes Possibles

### 1. Pool de Connexions Trop Petit

**Symptôme :** Beaucoup de "Connection reset by peer"

**Solution :** Ajouter des paramètres de pool dans `DATABASE_URL` :

```bash
# Format standard
DATABASE_URL="postgresql://user:password@host:port/dbname"

# Avec pool de connexions (recommandé)
DATABASE_URL="postgresql://user:password@host:port/dbname?connection_limit=20&pool_timeout=20"
```

### 2. Timeout de Connexion

**Symptôme :** Connexions qui se ferment rapidement

**Solution :** Ajouter `connect_timeout` :

```bash
DATABASE_URL="postgresql://user:password@host:port/dbname?connect_timeout=10"
```

### 3. Prisma Accelerate

**Symptôme :** Problèmes avec Prisma Accelerate sur Railway

**Solution :** Optionnel - Peut être désactivé si nécessaire. Le code gère automatiquement l'absence d'Accelerate.

### 4. Connexions Non Fermées

**Symptôme :** Accumulation de connexions ouvertes

**Solution :** Prisma gère automatiquement avec `onModuleDestroy`, mais vérifiez que les transactions sont bien fermées.

## ✅ Configuration Recommandée

### DATABASE_URL Optimale

Pour Railway/Supabase :

```bash
DATABASE_URL="postgresql://user:password@host:port/dbname?connection_limit=20&pool_timeout=20&connect_timeout=10&sslmode=require"
```

### Paramètres Explicités

- `connection_limit=20` : Nombre max de connexions simultanées
- `pool_timeout=20` : Timeout pour obtenir une connexion du pool (secondes)
- `connect_timeout=10` : Timeout pour établir la connexion (secondes)
- `sslmode=require` : Force SSL (requis pour Railway/Supabase)

## 🔄 Sur Railway

### 1. Vérifier DATABASE_URL

Dans Railway → PostgreSQL → Variables :
- La `DATABASE_URL` devrait déjà inclure les paramètres SSL
- Si non, ajoutez les paramètres de pool manuellement

### 2. Vérifier les Logs

Les logs PostgreSQL affichent :
- `database system is ready to accept connections` ✅ OK
- `could not receive data from client: Connection reset by peer` ❌ Problème

### 3. Redémarrer le Service

Après modification de `DATABASE_URL`, redéployez le backend.

## 🧪 Tester la Connexion

### Depuis le Backend

1. Accédez à `/health` (endpoint health check)
2. Vérifiez le statut de la base de données

### Depuis Railway Shell

```bash
# Se connecter à PostgreSQL depuis Railway
railway connect postgresql

# Ou tester avec psql
psql $DATABASE_URL
```

### Depuis votre Machine

```bash
# Si Railway expose la DB (peut nécessiter un tunnel)
psql "postgresql://user:password@host:port/dbname"
```

## ⚠️ Messages PostgreSQL Normaux

Ces messages sont **normaux** et ne sont pas des erreurs :

```
✅ database system is ready to accept connections
✅ checkpoint complete
```

Ces messages indiquent un **problème** :

```
❌ could not receive data from client: Connection reset by peer
❌ connection to client lost
❌ too many connections
```

## 🔧 Solutions selon le Contexte

### En Local

Si vous utilisez Docker PostgreSQL :

```bash
# Vérifier que PostgreSQL tourne
docker ps | grep postgres

# Vérifier les logs
docker logs <container_id>
```

### En Production (Railway)

1. **Vérifier les métriques Railway**
   - Nombre de connexions actives
   - Utilisation mémoire/CPU

2. **Augmenter le pool si nécessaire**
   ```bash
   DATABASE_URL="...?connection_limit=50"
   ```

3. **Vérifier les limites Railway**
   - Plan gratuit : limité en connexions
   - Upgrade si nécessaire

## 📊 Monitoring

### Logs à Surveiller

```
✅ Connexion réussie :
LOG:  database system is ready to accept connections

❌ Problèmes :
LOG:  could not receive data from client
LOG:  too many connections for role
FATAL: remaining connection slots are reserved
```

### Métriques Prisma

Le service Prisma log maintenant :
- ✅ Connexion réussie
- ❌ Erreurs de connexion
- ⚠️ Avertissements

## 🎯 Checklist de Dépannage

- [ ] `DATABASE_URL` est correctement configurée
- [ ] Les paramètres de pool sont présents dans `DATABASE_URL`
- [ ] SSL est activé (`sslmode=require`)
- [ ] Le backend peut se connecter (test avec `/health`)
- [ ] Les logs Prisma ne montrent pas d'erreurs
- [ ] Railway ne montre pas de limites atteintes
- [ ] Les transactions sont bien fermées dans le code

## 💡 Bonnes Pratiques

1. **Toujours fermer les transactions**
   ```typescript
   await prisma.$transaction(async (tx) => {
     // ... code
   }); // Fermé automatiquement
   ```

2. **Utiliser les connexions efficacement**
   - Éviter de garder des connexions ouvertes
   - Utiliser le pooling Prisma (automatique)

3. **Gérer les erreurs de connexion**
   ```typescript
   try {
     await prisma.user.findMany();
   } catch (error) {
     if (error.code === 'P1001') {
       // Erreur de connexion
       // Retry logic
     }
   }
   ```

## 🔗 Ressources

- [Prisma Connection Pool](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [PostgreSQL Connection Limits](https://www.postgresql.org/docs/current/runtime-config-connection.html)
- [Railway PostgreSQL Docs](https://docs.railway.app/databases/postgresql)

