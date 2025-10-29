# ExStrat Frontend

Frontend Next.js pour ExStrat - Plateforme de gestion de stratégies crypto.

## Documentation

Pour la documentation complète du projet, consultez le [README principal](../../README.md) et la [documentation de développement](../../docs/DEVELOPMENT.md).

## Démarrage rapide

```bash
npm install
npm run dev
```

Le frontend sera disponible sur http://localhost:3001

## Structure

```
src/
├── app/          # Pages Next.js (App Router)
├── components/   # Composants React
├── contexts/     # Contextes React (Auth, Portfolio, Theme)
├── lib/          # Utilitaires et API
└── types/        # Types TypeScript
```

## Configuration

Créer un fichier `.env.local` :

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```
