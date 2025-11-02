# 🔧 Dépannage CORS - ExStrat

## ❌ Erreur : "Not allowed by CORS"

Si vous voyez cette erreur dans les logs Railway :

```
[Nest] ERROR [ExceptionsHandler] Error: Not allowed by CORS
```

## 🔍 Diagnostic

### 1. Vérifier les Variables d'Environnement sur Railway

Dans votre backend Railway, allez dans **Variables** et vérifiez :

```bash
NODE_ENV=production          # ⚠️ DOIT être "production"
FRONTEND_URL=https://...    # URL exacte de votre frontend Vercel
```

### 2. Vérifier l'URL de Votre Frontend

L'URL doit être **exactement** la même que celle de Vercel :

✅ **Correct :**
```
FRONTEND_URL=https://exstrat.vercel.app
```

❌ **Incorrect :**
```
FRONTEND_URL=https://www.exstrat.vercel.app  # Différent !
FRONTEND_URL=http://exstrat.vercel.app       # Pas de https
FRONTEND_URL=exstrat.vercel.app               # Manque https://
```

### 3. Regarder les Logs Railway

Les logs affichent maintenant l'origine bloquée et les origines autorisées :

```
🚫 CORS bloqué pour l'origine: https://exstrat-xyz.vercel.app
✅ Origines autorisées: https://exstrat.vercel.app, https://exstrat.com, ...
🌍 FRONTEND_URL: https://exstrat.vercel.app
```

## ✅ Solutions

### Solution 1 : Ajouter l'URL Manquante

Si votre frontend a une URL différente de celle configurée :

1. Dans Railway, ajoutez la variable :
   ```
   FRONTEND_URL=https://votre-vraie-url.vercel.app
   ```

2. Redéployez le backend

### Solution 2 : Tester en Local

Si vous testez votre frontend local avec le backend Railway :

1. Les logs montreront l'origine bloquée (ex: `http://localhost:3001`)
2. Cette origine est déjà dans la liste autorisée en développement
3. Vérifiez que `NODE_ENV` n'est pas défini sur Railway (ou est `development`)

### Solution 3 : Autoriser Temporairement Toutes les Origines (DÉVELOPPEMENT UNIQUEMENT)

⚠️ **NE FAITES PAS ÇA EN PRODUCTION !**

Si vous êtes en développement et voulez tester rapidement :

1. Dans Railway, mettez temporairement :
   ```
   NODE_ENV=development
   ```

2. Redéployez

3. ⚠️ **Remettez `NODE_ENV=production` après vos tests !**

### Solution 4 : Vérifier le Protocole (http vs https)

Si votre frontend est en `http://` mais Railway attend `https://` :

- **En développement** : CORS autorise localhost automatiquement
- **En production** : Assurez-vous que Vercel utilise `https://`

### Solution 5 : Ajouter Plusieurs URLs

Si vous avez plusieurs domaines :

Dans `exstrat_backend/src/main.ts`, la liste `productionOrigins` peut contenir plusieurs URLs :

```typescript
const productionOrigins = [
  process.env.FRONTEND_URL,
  'https://exstrat.vercel.app',
  'https://exstrat.com',
  'https://www.exstrat.com',
].filter(Boolean);
```

## 📝 Checklist de Vérification

- [ ] `NODE_ENV=production` est défini sur Railway
- [ ] `FRONTEND_URL` contient l'URL **exacte** de votre frontend Vercel
- [ ] L'URL commence par `https://` (pas `http://`)
- [ ] L'URL ne contient pas de trailing slash (`/`) à la fin
- [ ] Le backend a été redéployé après modification des variables
- [ ] Vous avez vérifié les logs Railway pour voir l'origine bloquée

## 🔄 Workflow de Débogage

1. **Regardez les logs Railway** - Ils affichent maintenant l'origine bloquée
2. **Copiez l'origine exacte** depuis les logs
3. **Ajoutez-la à `FRONTEND_URL`** ou dans la liste `productionOrigins`
4. **Redéployez le backend**
5. **Testez à nouveau**

## 🎯 Exemple Complet

**Scénario :** Votre frontend est sur `https://exstrat-abc123.vercel.app`

**Logs Railway :**
```
🚫 CORS bloqué pour l'origine: https://exstrat-abc123.vercel.app
✅ Origines autorisées: https://exstrat.vercel.app, ...
```

**Solution :**

1. Dans Railway, modifiez :
   ```
   FRONTEND_URL=https://exstrat-abc123.vercel.app
   ```

2. Ou ajoutez dans `main.ts` :
   ```typescript
   const productionOrigins = [
     process.env.FRONTEND_URL,
     'https://exstrat-abc123.vercel.app', // Ajouté
     // ...
   ];
   ```

3. Redéployez

## ⚠️ Important

- **Ne jamais autoriser toutes les origines en production** (`origin: true`)
- **Toujours utiliser `https://` en production**
- **Toujours définir `NODE_ENV=production` sur Railway**

## 📞 Besoin d'Aide ?

Si le problème persiste :
1. Partagez les logs Railway complets
2. Partagez la valeur de `FRONTEND_URL` (sans le mot de passe/api key si présent)
3. Partagez l'URL exacte de votre frontend Vercel

