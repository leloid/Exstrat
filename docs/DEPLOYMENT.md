# Guide de Déploiement - ExStrat

Ce guide vous explique comment déployer le backend et le frontend ExStrat en production.

## 🎯 Solution Recommandée : Railway + Vercel

**Pourquoi cette solution ?**
- **Railway** : Excellent pour déployer NestJS avec PostgreSQL, simple et abordable
- **Vercel** : Optimal pour Next.js (créé par l'équipe Next.js), gratuit pour commencer
- Compatibilité native avec Prisma et PostgreSQL

## 📋 Prérequis

1. Compte GitHub (pour le déploiement continu)
2. Compte Railway (https://railway.app) - gratuit pour commencer
3. Compte Vercel (https://vercel.com) - gratuit pour commencer
4. Compte CoinMarketCap (pour l'API key si nécessaire)

---

## 🗄️ Étape 1 : Déployer la Base de Données PostgreSQL

### Option A : Railway PostgreSQL (Recommandé)

1. **Créer un compte Railway**
   - Allez sur https://railway.app
   - Connectez-vous avec GitHub

2. **Créer un nouveau projet**
   - Cliquez sur "New Project"
   - Sélectionnez "Provision PostgreSQL"

3. **Récupérer l'URL de connexion**
   - Cliquez sur la base de données PostgreSQL
   - Onglet "Variables"
   - Copiez la variable `DATABASE_URL` (format: `postgresql://user:password@host:port/dbname`)

### Option B : Supabase (Alternative gratuite)

1. Créez un compte sur https://supabase.com
2. Créez un nouveau projet
3. Récupérez l'URL de connexion dans Settings > Database > Connection string

---

## 🚀 Étape 2 : Déployer le Backend (NestJS)

### Méthode 1 : Railway (Recommandé)

1. **Préparer le repository**
   ```bash
   cd exstrat_backend
   ```

2. **Créer un fichier `railway.json`** (optionnel mais recommandé)
   ```json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "NIXPACKS",
       "buildCommand": "npm install && npm run build && npx prisma generate && npx prisma migrate deploy"
     },
     "deploy": {
       "startCommand": "npm run start:prod",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

3. **Déployer sur Railway**
   - Dans Railway, cliquez sur "New Project"
   - Sélectionnez "Deploy from GitHub repo"
   - Choisissez votre repository
   - Sélectionnez le dossier `exstrat_backend`
   - Railway détectera automatiquement NestJS

4. **Configurer les variables d'environnement**
   - Dans Railway, allez dans "Variables"
   - Ajoutez les variables suivantes :
   ```
   DATABASE_URL=<URL de votre base de données PostgreSQL>
   JWT_SECRET=<Générez une clé secrète aléatoire (ex: openssl rand -base64 32)>
   JWT_EXPIRES_IN=7d
   PORT=3000
   NODE_ENV=production
   COINMARKETCAP_API_KEY=<Votre clé API CoinMarketCap>
   ```

5. **Exécuter les migrations Prisma**
   - Dans Railway, allez dans "Settings" > "Deployments"
   - Ouvrez un shell ou utilisez Railway CLI :
   ```bash
   railway run npx prisma migrate deploy
   ```

### Méthode 2 : Render (Alternative)

1. Créez un compte sur https://render.com
2. Créez un nouveau "Web Service"
3. Connectez votre repository GitHub
4. Configuration :
   - **Build Command**: `npm install && npm run build && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `npm run start:prod`
   - **Environment**: Node
5. Ajoutez les variables d'environnement comme pour Railway

---

## 🌐 Étape 3 : Déployer le Frontend (Next.js)

### Méthode 1 : Vercel (Recommandé)

1. **Préparer le repository**
   ```bash
   cd exstrat
   ```

2. **Déployer sur Vercel**
   - Allez sur https://vercel.com
   - Connectez-vous avec GitHub
   - Cliquez sur "Add New Project"
   - Importez votre repository
   - Sélectionnez le dossier `exstrat/exstrat` (ou ajustez le Root Directory)

3. **Configurer les variables d'environnement**
   - Dans Vercel, allez dans "Settings" > "Environment Variables"
   - Ajoutez :
   ```
   NEXT_PUBLIC_API_BASE_URL=https://votre-backend.railway.app
   ```
   ⚠️ Remplacez `https://votre-backend.railway.app` par l'URL de votre backend déployé

4. **Déployer**
   - Vercel détectera automatiquement Next.js
   - Le déploiement se fera automatiquement

### Méthode 2 : Railway (Alternative)

Si vous préférez tout sur Railway :

1. Dans Railway, créez un nouveau service
2. Sélectionnez votre repository et le dossier `exstrat/exstrat`
3. Railway détectera Next.js automatiquement
4. Ajoutez la variable d'environnement :
   ```
   NEXT_PUBLIC_API_BASE_URL=https://votre-backend.railway.app
   ```

---

## ⚙️ Étape 4 : Configuration Post-Déploiement

### Backend

1. **Mettre à jour CORS dans `main.ts`**
   ```typescript
   app.enableCors({
     origin: process.env.FRONTEND_URL || 'https://votre-frontend.vercel.app',
     credentials: true,
     // ... reste de la config
   });
   ```

2. **Variable d'environnement à ajouter :**
   ```
   FRONTEND_URL=https://votre-frontend.vercel.app
   ```

### Frontend

1. Vérifiez que `NEXT_PUBLIC_API_BASE_URL` pointe vers votre backend
2. Testez la connexion depuis le frontend déployé

---

## 📝 Checklist de Déploiement

### Backend
- [ ] Base de données PostgreSQL créée
- [ ] Backend déployé sur Railway/Render
- [ ] Variables d'environnement configurées :
  - [ ] `DATABASE_URL`
  - [ ] `JWT_SECRET`
  - [ ] `JWT_EXPIRES_IN`
  - [ ] `PORT`
  - [ ] `NODE_ENV=production`
  - [ ] `COINMARKETCAP_API_KEY`
  - [ ] `FRONTEND_URL`
- [ ] Migrations Prisma exécutées
- [ ] Backend accessible et répond aux requêtes
- [ ] CORS configuré correctement

### Frontend
- [ ] Frontend déployé sur Vercel/Railway
- [ ] Variable `NEXT_PUBLIC_API_BASE_URL` configurée
- [ ] Frontend accessible et se connecte au backend
- [ ] Authentification fonctionne
- [ ] Toutes les pages chargent correctement

---

## 🔐 Sécurité en Production

### Variables Sensibles

1. **Ne jamais commit de secrets dans Git**
   - Vérifiez que `.env` est dans `.gitignore`
   - Utilisez uniquement les variables d'environnement de la plateforme

2. **JWT_SECRET**
   - Générez une clé forte : `openssl rand -base64 32`
   - Ne la partagez jamais

3. **DATABASE_URL**
   - Gardez-la secrète
   - Utilisez les variables d'environnement de la plateforme

---

## 🔄 Migrations de Base de Données

Après chaque modification du schéma Prisma :

1. **En local** :
   ```bash
   cd exstrat_backend
   npx prisma migrate dev --name nom_de_la_migration
   ```

2. **En production** (Railway CLI) :
   ```bash
   railway login
   railway link
   railway run npx prisma migrate deploy
   ```

3. **Ou via Railway Dashboard** :
   - Ouvrez un shell dans Railway
   - Exécutez : `npx prisma migrate deploy`

---

## 📊 Monitoring et Logs

### Railway
- Logs disponibles dans le Dashboard
- Métriques de performance disponibles

### Vercel
- Logs disponibles dans le Dashboard
- Analytics intégrées

---

## 🐛 Dépannage

### Backend ne démarre pas
1. Vérifiez les logs dans Railway/Render
2. Vérifiez que toutes les variables d'environnement sont définies
3. Vérifiez que les migrations Prisma ont été exécutées

### Frontend ne se connecte pas au backend
1. Vérifiez `NEXT_PUBLIC_API_BASE_URL`
2. Vérifiez les CORS du backend
3. Vérifiez les logs du navigateur (Console DevTools)

### Erreurs de base de données
1. Vérifiez que `DATABASE_URL` est correcte
2. Vérifiez que les migrations ont été exécutées
3. Vérifiez la connexion à la base de données

---

## 💰 Coûts Estimés

### Gratuit (Pour commencer)
- **Railway** : $5 de crédit gratuit/mois
- **Vercel** : Plan Hobby gratuit (illimité pour projets personnels)
- **Supabase** : Plan gratuit généreux (500MB DB, 2GB bande passante)

### Payant (Si nécessaire)
- **Railway** : ~$5-10/mois pour petit traffic
- **Vercel** : Gratuit jusqu'à 100GB/mois
- **PostgreSQL** : Gratuit sur Railway/Supabase pour petits projets

---

## 📚 Ressources

- [Railway Documentation](https://docs.railway.app/)
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Deploy Guide](https://www.prisma.io/docs/guides/deployment)
- [Supabase Documentation](https://supabase.com/docs)

---

## 🚀 Déploiement Rapide (TL;DR)

1. **Base de données** : Créez PostgreSQL sur Railway
2. **Backend** : Déployez `exstrat_backend` sur Railway, ajoutez les variables d'env, exécutez les migrations
3. **Frontend** : Déployez `exstrat/exstrat` sur Vercel, ajoutez `NEXT_PUBLIC_API_BASE_URL`
4. **CORS** : Mettez à jour l'URL frontend dans le backend
5. **Testez** : Vérifiez que tout fonctionne !

