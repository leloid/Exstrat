# 🔧 Variables d'Environnement Vercel - Frontend

## 📋 Variable Nécessaire

### Variable Obligatoire

Dans Vercel → Votre Projet → **Settings** → **Environment Variables**, ajoutez :

```
NEXT_PUBLIC_API_BASE_URL=https://exstrat-production.up.railway.app
```

⚠️ **Important** : 
- Remplacez `https://exstrat-production.up.railway.app` par l'URL **réelle** de votre backend Railway
- Le préfixe `NEXT_PUBLIC_` est **obligatoire** pour que la variable soit accessible côté client dans Next.js

### Format Complet

```
NEXT_PUBLIC_API_BASE_URL=https://votre-backend.railway.app
```

**Sans** trailing slash (`/`) à la fin !

## 🔍 Comment Trouver l'URL du Backend

1. **Railway → Backend Service → Settings → Networking**
2. Copiez l'URL publique (ex: `exstrat-production.up.railway.app`)
3. Ajoutez `https://` devant

Ou :

1. **Railway → Backend Service → Variables**
2. Cherchez `RAILWAY_PUBLIC_DOMAIN` (si disponible)
3. Format : `https://${RAILWAY_PUBLIC_DOMAIN}`

## 📝 Configuration dans Vercel

### Étape 1 : Accéder aux Variables

1. Vercel → Votre Projet
2. **Settings** (en haut)
3. **Environment Variables** (menu de gauche)

### Étape 2 : Ajouter la Variable

1. Cliquez sur **"Add New"**
2. **Key** : `NEXT_PUBLIC_API_BASE_URL`
3. **Value** : `https://exstrat-production.up.railway.app` (votre URL Railway)
4. **Environment** : Sélectionnez tous les environnements :
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Cliquez sur **"Save"**

### Étape 3 : Redéployer

Après avoir ajouté la variable :
1. Vercel redéploiera automatiquement
2. Ou allez dans **Deployments** → Cliquez sur **"Redeploy"**

## ✅ Vérification

### Test 1 : Vérifier dans les Logs

Vercel → Deployments → Cliquez sur un déploiement → **Build Logs**

Vous devriez voir que la variable est disponible.

### Test 2 : Vérifier dans le Code

Le frontend utilise cette variable dans `src/lib/api.ts` :

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
```

Si `NEXT_PUBLIC_API_BASE_URL` n'est pas définie, il utilisera `http://localhost:3000` (développement).

### Test 3 : Tester l'Application

1. Ouvrez votre application Vercel
2. Ouvrez la Console du navigateur (F12)
3. Regardez les requêtes réseau
4. Vérifiez qu'elles pointent vers votre backend Railway

## ⚠️ Erreurs Communes

### Erreur : "Cannot read property of undefined"

**Cause** : Variable mal nommée (manque `NEXT_PUBLIC_`)

**Solution** : Utilisez `NEXT_PUBLIC_API_BASE_URL` (avec le préfixe)

### Erreur : "Network Error"

**Cause** : URL incorrecte ou backend inaccessible

**Solution** : 
1. Vérifiez que l'URL du backend est correcte
2. Vérifiez que le backend Railway est actif
3. Vérifiez les CORS dans le backend

### Erreur : CORS

**Cause** : Backend ne permet pas les requêtes depuis Vercel

**Solution** : 
1. Railway → Backend → Variables
2. Ajoutez `FRONTEND_URL=https://votre-frontend.vercel.app`
3. Redéployez le backend

## 🔄 Mise à Jour de l'URL

Si vous changez l'URL du backend :

1. Vercel → Settings → Environment Variables
2. Modifiez `NEXT_PUBLIC_API_BASE_URL`
3. Sauvegardez
4. Redéployez (automatique ou manuel)

## 📊 Variables Optionnelles

Normalement, **une seule variable** est nécessaire : `NEXT_PUBLIC_API_BASE_URL`

Si vous avez besoin d'autres variables (API keys, etc.) :

```
NEXT_PUBLIC_API_BASE_URL=https://exstrat-production.up.railway.app
NEXT_PUBLIC_ANALYTICS_ID=xxx  # Exemple si vous utilisez Google Analytics
```

## ✅ Checklist

- [ ] Variable `NEXT_PUBLIC_API_BASE_URL` ajoutée dans Vercel
- [ ] URL pointe vers votre backend Railway (avec `https://`)
- [ ] Pas de trailing slash (`/`) à la fin
- [ ] Variable disponible pour Production, Preview, Development
- [ ] Frontend redéployé
- [ ] Test de connexion au backend réussi

## 🎯 Résumé

**Une seule variable nécessaire** :

```
NEXT_PUBLIC_API_BASE_URL=https://votre-backend.railway.app
```

C'est tout ! 🚀

