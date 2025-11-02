# 🔧 Configuration Build Vercel - Next.js

## 📋 Settings à Configurer

Pour votre projet Next.js dans `exstrat/exstrat`, voici les valeurs recommandées :

### 1. **Build Command**
```
npm run build
```

Ou simplement :
```
next build
```

✅ **Les deux fonctionnent**, mais `npm run build` est préféré car il utilise le script défini dans `package.json`.

### 2. **Output Directory**
```
.next
```

Ou laissez **"Next.js default"** - Vercel détectera automatiquement `.next`

✅ **Recommandé** : Laissez "Next.js default" (Vercel gère automatiquement)

### 3. **Install Command**
```
npm install
```

Ou si vous utilisez un autre gestionnaire de paquets :
- `yarn install`
- `pnpm install`
- `bun install`

✅ **Recommandé** : `npm install` (par défaut)

## ✅ Configuration Recommandée

**La plupart du temps, vous n'avez rien à modifier !**

Vercel détecte automatiquement :
- ✅ Que c'est un projet Next.js
- ✅ Le build command (`npm run build`)
- ✅ Le output directory (`.next`)
- ✅ L'install command (`npm install`)

**Donc laissez les valeurs par défaut** - elles fonctionneront !

## 🔍 Quand Modifier ?

### Si votre projet est dans un sous-dossier

Si votre repo est structuré comme :
```
repo/
  exstrat/
    exstrat/    ← Votre projet Next.js est ici
      package.json
      next.config.ts
      ...
```

Dans Vercel → Settings → General → **Root Directory** :
```
exstrat/exstrat
```

Puis dans Build Settings, gardez les valeurs par défaut.

### Si vous avez un build custom

Seulement si votre `package.json` a un script build différent :

```json
{
  "scripts": {
    "build": "next build && echo 'Custom build step'"
  }
}
```

Alors utilisez le build command custom.

## ⚠️ Cas Particuliers

### Si Build échoue

1. Vérifiez les **Build Logs** dans Vercel
2. Regardez l'erreur exacte
3. Ajustez si nécessaire

### Si Output Directory est incorrect

Next.js génère toujours dans `.next`, donc ne changez que si vous avez une configuration très spécifique.

## 📝 Résumé

**Pour votre projet Next.js standard** :

- **Build Command** : `npm run build` (ou laissez la valeur suggérée)
- **Output Directory** : "Next.js default" (laissez tel quel)
- **Install Command** : `npm install` (ou laissez la valeur suggérée)

**En général** : Laissez tout par défaut ! Vercel est très intelligent pour détecter Next.js. 🚀

