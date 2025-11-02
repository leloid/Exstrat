# 🔧 Résolution : "Can't reach database server at postgres.railway.internal"

## ❌ Erreur

```
PrismaClientInitializationError: Can't reach database server at `postgres.railway.internal:5432`
```

## 🔍 Causes Possibles

### 1. Services dans des projets différents

`postgres.railway.internal` fonctionne **uniquement** si :
- ✅ Backend et PostgreSQL sont dans le **même projet Railway**
- ✅ Backend peut résoudre le DNS interne

### 2. DATABASE_URL incorrecte

La variable `DATABASE_URL` pourrait pointer vers une URL interne qui n'est pas accessible.

### 3. Réseau privé non disponible

Parfois le réseau privé Railway n'est pas immédiatement disponible.

## ✅ Solutions

### Solution 1 : Vérifier que les services sont dans le même projet

1. Railway → Dashboard
2. Vérifiez que **Backend** et **PostgreSQL** sont dans le **même projet**
3. Si non, déplacez-les dans le même projet

### Solution 2 : Utiliser DATABASE_PUBLIC_URL (Alternative)

Si le réseau privé ne fonctionne pas, utilisez l'URL publique :

1. Railway → PostgreSQL → **Variables**
2. Copiez `DATABASE_PUBLIC_URL` (format : `postgresql://...@mainline.proxy.rlwy.net:15720/railway`)
3. Railway → Backend → **Variables**
4. Remplacez `DATABASE_URL` par la valeur de `DATABASE_PUBLIC_URL`

⚠️ **Note** : L'URL publique fonctionne mais est moins optimale que l'interne.

### Solution 3 : Vérifier DATABASE_URL avec Variable Reference

**Méthode Recommandée** :

1. Railway → Backend → **Variables**
2. Cliquez sur **"Variable Reference"** dans le banner
3. Sélectionnez votre service **PostgreSQL**
4. Choisissez `DATABASE_URL`
5. Railway créera automatiquement une référence valide

### Solution 4 : Utiliser l'URL avec le proxy TCP

Si les autres solutions ne fonctionnent pas :

1. Railway → PostgreSQL → **Variables**
2. Créez une nouvelle variable manuellement :
   ```
   DATABASE_URL=postgresql://postgres:VOTRE_PASSWORD@mainline.proxy.rlwy.net:15720/railway?sslmode=require
   ```
   - Remplacez `VOTRE_PASSWORD` par le mot de passe de `PGPASSWORD`
   - Utilisez le port proxy (ex: `15720`)

## 🔍 Diagnostic

### 1. Vérifier les Variables

Dans Railway → Backend → **Variables**, vérifiez :

```bash
DATABASE_URL=postgresql://postgres:password@postgres.railway.internal:5432/railway
```

### 2. Vérifier que PostgreSQL tourne

Railway → PostgreSQL → **Metrics**
- Vérifiez que le service est actif
- Vérifiez l'utilisation CPU/mémoire

### 3. Tester depuis Railway Shell

Railway → Backend → **Deployments** → **Shell**

```bash
# Tester la connexion
psql $DATABASE_URL -c "SELECT 1;"
```

Si ça fonctionne → Le problème est dans le code
Si ça ne fonctionne pas → Le problème est la configuration

## ✅ Solution Rapide (Si Urgent)

### Option A : Utiliser DATABASE_PUBLIC_URL

1. Railway → PostgreSQL → Variables → Copiez `DATABASE_PUBLIC_URL`
2. Railway → Backend → Variables → `DATABASE_URL` = valeur de `DATABASE_PUBLIC_URL`
3. Redéployez le backend

### Option B : Recréer la Variable Reference

1. Railway → Backend → Variables
2. Supprimez `DATABASE_URL` existante
3. Cliquez sur "Variable Reference"
4. Sélectionnez PostgreSQL → `DATABASE_URL`
5. Redéployez

## 🎯 Checklist

- [ ] Backend et PostgreSQL dans le même projet Railway
- [ ] `DATABASE_URL` configurée dans Backend → Variables
- [ ] PostgreSQL service actif et démarré
- [ ] Variable Reference correctement configurée
- [ ] Backend redéployé après modification

## 💡 Bonnes Pratiques

1. **Utilisez toujours Variable Reference** pour `DATABASE_URL`
2. **Vérifiez que les services sont dans le même projet**
3. **Testez depuis Railway Shell** si problème de connexion

