#!/bin/bash

# Script pour nettoyer le cache Next.js et résoudre les erreurs de modules manquants

echo "🧹 Nettoyage complet du cache Next.js..."

# Supprimer le dossier .next
if [ -d ".next" ]; then
  rm -rf .next
  echo "✅ Dossier .next supprimé"
else
  echo "ℹ️  Dossier .next n'existe pas"
fi

# Supprimer le cache node_modules
if [ -d "node_modules/.cache" ]; then
  rm -rf node_modules/.cache
  echo "✅ Cache node_modules supprimé"
else
  echo "ℹ️  Cache node_modules n'existe pas"
fi

# Supprimer le cache SWC
if [ -d ".swc" ]; then
  rm -rf .swc
  echo "✅ Cache SWC supprimé"
else
  echo "ℹ️  Cache SWC n'existe pas"
fi

# Supprimer les fichiers de build TypeScript
find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null
if [ $? -eq 0 ]; then
  echo "✅ Fichiers TypeScript build supprimés"
else
  echo "ℹ️  Aucun fichier TypeScript build trouvé"
fi

# Supprimer les fichiers webpack chunks corrompus (comme 711.js)
echo "🔍 Recherche de fichiers webpack corrompus..."
find .next -name "*.js" -type f -path "*webpack*" -delete 2>/dev/null || true

echo ""
echo "✨ Nettoyage terminé ! Vous pouvez maintenant relancer le serveur avec 'npm run dev'"

