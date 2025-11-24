# 🚀 Guide de Déploiement Rapide - ExStrat

## Déploiement en 3 étapes

### 1️⃣ Base de Données PostgreSQL sur Railway

**⚠️ Important :** Prisma n'est PAS une base de données ! C'est juste un outil pour gérer PostgreSQL.  
En production, vous avez besoin d'une base PostgreSQL accessible depuis internet (pas votre DB locale).

1. Allez sur https://railway.app et connectez-vous
2. **Nouveau Projet** > **Provision PostgreSQL**
   - Cette base sera différente de votre DB locale
   - Elle sera accessible depuis internet pour votre backend
3. **Récupérer la DATABASE_URL** :
   - Dans Railway, cliquez sur votre service PostgreSQL
   - Allez dans l'onglet **"Variables"** (ou **"Settings"** → **"Variables"**)
   - Copiez la variable `DATABASE_URL` 
   - Format attendu : `postgresql://user:password@host:port/database`
   
   ⚠️ **Important** : Ne copiez PAS l'URL publique (`postgres-production-fe1c.up.railway.app`) dans votre navigateur !  
   Cette URL est pour les connexions TCP, pas pour HTTP. Utilisez la variable `DATABASE_URL` depuis l'onglet Variables.
   
   💡 **Astuce** : Si vous avez des erreurs de connexion, ajoutez ces paramètres à la fin de `DATABASE_URL` :
   ```
   ?connection_limit=20&pool_timeout=20&connect_timeout=10&sslmode=require
   ```
   Voir [`docs/DATABASE-CONNECTION-ISSUES.md`](docs/DATABASE-CONNECTION-ISSUES.md) pour plus de détails.
   
💡 **Besoin d'explications ?** Voir [`docs/DATABASE-EXPLAINED.md`](docs/DATABASE-EXPLAINED.md)
### 2️⃣ Backend (Railway)

1. Dans Railway, **Nouveau Service** > **GitHub Repo**
2. Sélectionnez votre repo et le dossier `exstrat_backend`

3. **Configurer DATABASE_URL** (⚠️ Important) :
   
   **Étape 1** : Vérifiez que Backend et PostgreSQL sont dans le **même projet Railway**
   
   **Étape 2** : **Méthode recommandée - Variable Reference** :
   - Dans Railway → Backend → **Variables**
   - Cliquez sur **"Variable Reference"** dans le banner violet
   - Sélectionnez votre service **PostgreSQL**
   - Choisissez `DATABASE_URL`
   - ✅ Railway créera automatiquement la référence
   
   **Étape 3** : Si erreur "Can't reach database server" :
   - Essayez avec `DATABASE_PUBLIC_URL` à la place
   - Ou vérifiez que les services sont bien dans le même projet
   - Voir [`docs/RAILWAY-CONNECTION-FIX.md`](docs/RAILWAY-CONNECTION-FIX.md)
   
   💡 **Normalement `DATABASE_URL` (interne) fonctionne, mais `DATABASE_PUBLIC_URL` est une alternative sûre.**

4. **Autres variables d'environnement** :
   ```
   JWT_SECRET=<générez: openssl rand -base64 32>
   JWT_EXPIRES_IN=7d
   PORT=3000
   NODE_ENV=production
   COINMARKETCAP_API_KEY=<votre clé>
   FRONTEND_URL=<sera rempli après déploiement frontend>
   BACKEND_URL=<URL de votre backend Railway, ex: https://exstrat-production.up.railway.app>
   ```
   
   💡 **Note** : `BACKEND_URL` est utile pour Swagger et les tests. Railway génère automatiquement cette URL.

5. **Créer les tables** (⚠️ Important) - **2 méthodes** :

   **Méthode A : Pre-Deploy Step (Recommandé - Automatique)** 🚀
   - Dans Railway → Backend → **Settings** → **Deploy**
   - Cliquez sur **"+ Add pre-deploy step"**
   - Command : `npx prisma migrate deploy`
   - ✅ Les migrations s'exécuteront automatiquement à chaque déploiement !
   
   **Méthode B : Manuel (Première fois seulement)** 🛠️
   - Une fois le backend déployé, allez dans **Deployments**
   - Ouvrez un **Shell** (terminal)
   - Exécutez :
     ```bash
     npx prisma migrate deploy
     ```
   - ✅ Les tables seront créées !
   
   ❌ **Ne créez PAS les tables manuellement dans Railway → Database !**

6. Notez l'URL de votre backend (ex: `https://exstrat-backend.railway.app`)
   
📚 **Besoin d'aide ?** Voir [`docs/RAILWAY-DATABASE-SETUP.md`](docs/RAILWAY-DATABASE-SETUP.md)

### 3️⃣ Frontend (Vercel)

1. Allez sur https://vercel.com et connectez-vous
2. **New Project** > Importez votre repo GitHub
3. **Root Directory** : `exstrat/exstrat`
4. Variable d'environnement :
   ```
   NEXT_PUBLIC_API_BASE_URL=https://votre-backend.railway.app
   ```
5. Cliquez sur **Deploy**

### 4️⃣ Finaliser

1. **⚠️ IMPORTANT - Configuration CORS** : Dans Railway (backend), ajoutez/modifiez :
   ```
   FRONTEND_URL=https://votre-frontend.vercel.app
   NODE_ENV=production
   ```
   - Remplacez `https://votre-frontend.vercel.app` par l'URL réelle de votre frontend Vercel
   - Si vous testez en local, vous pouvez temporairement laisser `localhost:3001` dans la liste
   
2. **Redéployez le backend** pour que les changements prennent effet

3. **Vérifiez les logs Railway** : Si vous avez encore des erreurs CORS, regardez les logs pour voir quelle origine est bloquée

✅ **C'est fait !** Votre application est déployée !

### 🔧 Dépannage CORS

Si vous avez encore des erreurs CORS :
1. Vérifiez que `FRONTEND_URL` dans Railway correspond exactement à l'URL de votre frontend (avec https://)
2. Vérifiez que `NODE_ENV=production` est bien défini dans Railway
3. Regardez les logs Railway pour voir quelle origine est bloquée
4. Les logs afficheront les origines autorisées pour debug

