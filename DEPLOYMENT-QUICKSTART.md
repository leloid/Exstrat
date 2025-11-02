# 🚀 Guide de Déploiement Rapide - ExStrat

## Déploiement en 3 étapes

### 1️⃣ Base de Données PostgreSQL sur Railway

**⚠️ Important :** Prisma n'est PAS une base de données ! C'est juste un outil pour gérer PostgreSQL.  
En production, vous avez besoin d'une base PostgreSQL accessible depuis internet (pas votre DB locale).

1. Allez sur https://railway.app et connectez-vous
2. **Nouveau Projet** > **Provision PostgreSQL**
   - Cette base sera différente de votre DB locale
   - Elle sera accessible depuis internet pour votre backend
3. Copiez la variable `DATABASE_URL` depuis l'onglet Variables
   (Format: `postgresql://user:password@host:port/database`)
   
   💡 **Astuce :** Si vous avez des erreurs de connexion, ajoutez ces paramètres :
   ```
   ?connection_limit=20&pool_timeout=20&connect_timeout=10&sslmode=require
   ```
   Voir [`docs/DATABASE-CONNECTION-ISSUES.md`](docs/DATABASE-CONNECTION-ISSUES.md) pour plus de détails.
   
💡 **Besoin d'explications ?** Voir [`docs/DATABASE-EXPLAINED.md`](docs/DATABASE-EXPLAINED.md)
### 2️⃣ Backend (Railway)

1. Dans Railway, **Nouveau Service** > **GitHub Repo**
2. Sélectionnez votre repo et le dossier `exstrat_backend`
3. Variables d'environnement à ajouter :
   ```
   DATABASE_URL=<collé depuis l'étape 1>
   JWT_SECRET=<générez: openssl rand -base64 32>
   JWT_EXPIRES_IN=7d
   PORT=3000
   NODE_ENV=production
   COINMARKETCAP_API_KEY=<votre clé>
   FRONTEND_URL=<sera rempli après déploiement frontend>
   ```
4. Dans **Deployments**, ouvrez un shell et exécutez :
   ```bash
   npx prisma migrate deploy
   ```
5. Notez l'URL de votre backend (ex: `https://exstrat-backend.railway.app`)

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

