# ⚡ Appliquer les Migrations IMMÉDIATEMENT

## ❌ Erreur Actuelle

```
The table `public.User` does not exist in the current database.
```

**Cause** : Les migrations Prisma n'ont pas été appliquées à la base de données.

## ✅ Solution Rapide

### Option A : Railway Shell (Le Plus Rapide) 🚀

1. **Railway → Backend → Deployments**
2. Cliquez sur **"Shell"** (icône terminal)
3. Exécutez :
   ```bash
   npx prisma migrate deploy
   ```
4. ✅ Attendez la confirmation que les migrations sont appliquées
5. ✅ Rechargez votre application

### Option B : Pre-Deploy Step (Pour Plus Tard)

Pour automatiser à l'avenir :

1. **Railway → Backend → Settings → Deploy**
2. Cliquez sur **"+ Add pre-deploy step"**
3. Command : `npx prisma migrate deploy`
4. Save

## 🔍 Vérification

Après avoir exécuté la migration :

1. **Vérifiez les tables** :
   - Railway → PostgreSQL → **Database**
   - Vous devriez voir : User, Portfolio, Transaction, Strategy, etc.

2. **Testez l'API** :
   - Essayez `/auth/signup` à nouveau
   - L'erreur devrait disparaître

## 📝 Ce qui va se passer

```bash
npx prisma migrate deploy
```

Cela va :
- ✅ Lire toutes les migrations dans `prisma/migrations/`
- ✅ Créer toutes les tables (User, Portfolio, Transaction, Strategy, etc.)
- ✅ Configurer les relations et contraintes
- ✅ Mettre à jour le schéma de la base de données

## ⚠️ Important

Les migrations doivent être **déjà commitées** dans votre repository Git.  
Si vous avez des migrations locales non commitées :
1. Committez-les
2. Poussez sur GitHub
3. Railway redéploiera
4. Puis exécutez `prisma migrate deploy`

## ✅ Checklist

- [ ] Migrations commitées dans Git ✅
- [ ] Backend déployé sur Railway ✅
- [ ] `DATABASE_URL` configurée ✅
- [ ] Shell Railway ouvert
- [ ] `npx prisma migrate deploy` exécuté
- [ ] Tables visibles dans PostgreSQL → Database
- [ ] `/auth/signup` fonctionne

