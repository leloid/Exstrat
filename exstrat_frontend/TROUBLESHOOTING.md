# Guide de dépannage

## Erreurs de modules manquants (`Cannot find module './711.js'` ou `./vendor-chunks/next.js`)

### Problème
Des erreurs apparaissent indiquant qu'un module webpack (comme `./711.js`, `./548.js`, ou `./vendor-chunks/next.js`) ne peut pas être trouvé. C'est un problème de cache corrompu de Next.js, souvent lors du démarrage en mode production (`npm run start`).

### Solution rapide

1. **Nettoyer le cache** :
   ```bash
   npm run clean
   # ou
   npm run clean:dev  # Nettoie et relance le serveur
   ```

2. **Pour un nettoyage complet** :
   ```bash
   npm run clean:full
   ```

3. **Redémarrer le serveur** :
   ```bash
   npm run dev
   ```

### Solution manuelle

Si les scripts ne fonctionnent pas, nettoyez manuellement :

```bash
# Supprimer tous les caches
rm -rf .next
rm -rf node_modules/.cache
rm -rf .swc

# Supprimer les fichiers de build TypeScript
find . -name "*.tsbuildinfo" -type f -delete

# Rebuilder le projet (important pour le mode production)
npm run build

# Relancer le serveur
npm run dev
# ou pour la production
npm run start
```

### Solution pour le mode production

Si l'erreur apparaît lors de `npm run start`, vous devez **rebuilder** le projet :

```bash
# 1. Nettoyer le cache
npm run clean

# 2. Rebuilder
npm run build

# 3. Relancer en production
npm run start
```

### Pourquoi cela arrive ?

Ces erreurs sont généralement causées par :
- Un cache Next.js corrompu après des modifications de fichiers
- Des chunks webpack qui pointent vers des fichiers qui n'existent plus
- Des problèmes de synchronisation entre le build et le serveur de développement
- Des arrêts brutaux du serveur pendant le hot reload

### Prévention

- Utilisez `npm run clean:dev` régulièrement si vous rencontrez des problèmes
- Évitez d'arrêter brutalement le serveur (utilisez Ctrl+C proprement)
- Redémarrez le serveur après des changements majeurs dans la configuration
- Utilisez `npm run clean:full` si les erreurs persistent

---

## Erreurs 404 CSS répétées (`/_next/static/css/app/layout.css`)

### Problème
Des erreurs 404 répétées apparaissent dans la console pour le fichier CSS `layout.css`. Cela peut ralentir le développement et nécessiter de redémarrer le serveur.

### Solution rapide

1. **Nettoyer le cache** :
   ```bash
   npm run clean
   # ou
   npm run clean:dev  # Nettoie et relance le serveur
   ```

2. **Redémarrer le serveur** :
   ```bash
   npm run dev
   ```

### Solution manuelle

Si les scripts ne fonctionnent pas, nettoyez manuellement :

```bash
# Supprimer le cache Next.js
rm -rf .next

# Supprimer le cache node_modules
rm -rf node_modules/.cache

# Relancer le serveur
npm run dev
```

### Pourquoi cela arrive ?

Ces erreurs sont généralement causées par :
- Le hot reload de Next.js qui essaie de charger des fichiers CSS qui n'existent pas encore
- Un cache corrompu après des modifications de fichiers
- Des problèmes de synchronisation entre le serveur de développement et le navigateur

### Prévention

- Utilisez `npm run clean:dev` régulièrement si vous rencontrez des problèmes
- Évitez de modifier plusieurs fichiers CSS en même temps
- Redémarrez le serveur après des changements majeurs dans la configuration

