# 🚀 Guide de Déploiement Rapide - ExStrat

## Déploiement en 3 étapes

### 1️⃣ Base de Données (Railway)

1. Allez sur https://railway.app et connectez-vous
2. **Nouveau Projet** > **Provision PostgreSQL**
3. Copiez la variable `DATABASE_URL` depuis l'onglet Variables
postgresql://postgres:KpEZXHttswSOIJkSHSbSwwyLxwccdYxq@mainline.proxy.rlwy.net:15720/railway
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

1. Dans Railway (backend), ajoutez :
   ```
   FRONTEND_URL=https://votre-frontend.vercel.app
   ```
2. Redéployez le backend si nécessaire

✅ **C'est fait !** Votre application est déployée !

