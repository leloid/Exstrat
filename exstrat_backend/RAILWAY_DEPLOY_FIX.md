# 🔧 Fix pour le déploiement Railway qui bloque

## Problème
Le déploiement bloque sur "Running pre-deploy command..." pendant 30+ minutes.

## Cause
Railway exécute `npx prisma migrate deploy` dans le pre-deploy command, et cette commande peut bloquer si :
- La connexion à la base de données est lente
- Il y a un timeout réseau
- La migration est déjà appliquée mais Railway essaie quand même de l'exécuter

## Solution 1 : Retirer la commande pre-deploy (RECOMMANDÉ)

1. Allez dans **Railway Dashboard** → Votre service backend → **Settings** → **Deploy**
2. Trouvez la section **"Pre-deploy Command"**
3. **Videz le champ** ou supprimez `npx prisma migrate deploy`
4. Sauvegardez
5. Redéployez

## Solution 2 : Utiliser le script optimisé

Si vous voulez garder les migrations automatiques, remplacez la commande pre-deploy par :

```bash
./scripts/check-and-migrate.sh
```

Ce script :
- Vérifie rapidement la connexion DB (timeout 10s)
- Vérifie le statut des migrations (timeout 30s)
- Applique les migrations seulement si nécessaire (timeout 60s)
- Continue le déploiement même en cas de timeout

## Solution 3 : Appliquer les migrations manuellement

1. Retirez la commande pre-deploy dans Railway
2. Après le déploiement, exécutez manuellement :
   ```bash
   npx prisma migrate deploy
   ```

## Vérification

Après avoir retiré la commande pre-deploy, le déploiement devrait :
- Build : ~2-3 minutes
- Deploy : ~1-2 minutes
- **Total : ~5 minutes max** (au lieu de 30+ minutes)

## Note importante

Les migrations Prisma peuvent être appliquées :
- **Avant le déploiement** (pre-deploy) - peut bloquer
- **Pendant le build** - non recommandé car la DB peut ne pas être accessible
- **Après le déploiement** (manuellement) - recommandé pour éviter les blocages
- **Au démarrage de l'app** - possible mais non recommandé car ralentit le démarrage

La meilleure pratique est d'appliquer les migrations **manuellement** après le déploiement, ou d'utiliser un script optimisé avec timeouts.

