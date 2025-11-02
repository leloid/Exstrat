# 🔍 Comprendre Prisma : Local vs Production

## 📚 Différence entre les Commandes Prisma

### 🏠 En Local (Développement)

Quand vous développez sur votre machine :

```bash
npx prisma migrate dev
```

**Ce que cette commande fait :**
1. ✅ **Lit votre schéma** (`schema.prisma`)
2. ✅ **Compare avec la base de données** actuelle
3. ✅ **Crée automatiquement** une nouvelle migration si le schéma a changé
4. ✅ **Applique la migration** à votre base de données locale
5. ✅ **Génère le Prisma Client** (`@prisma/client`) avec les nouveaux types
6. ✅ **Ouvre Prisma Studio** (optionnel) pour voir vos données

**Quand l'utiliser :**
- Quand vous modifiez le schéma Prisma
- Pour créer de nouvelles migrations
- Pendant le développement

---

### 🚀 En Production (Déploiement)

Quand vous déployez sur Railway/Vercel/etc :

```bash
npx prisma migrate deploy
```

**Ce que cette commande fait :**
1. ✅ **Lit les migrations existantes** (dans `prisma/migrations/`)
2. ✅ **Applique uniquement les migrations** qui n'ont pas encore été appliquées
3. ✅ **NE crée PAS** de nouvelles migrations
4. ✅ **Génère le Prisma Client** pour la production

**Quand l'utiliser :**
- Après chaque déploiement
- Pour mettre à jour la base de données en production
- Dans les scripts de build/déploiement

---

## 🔄 Workflow Typique

### 1. Développement Local

```bash
# 1. Vous modifiez schema.prisma
# Exemple: Ajout d'un champ "email" au modèle User

# 2. Créer et appliquer la migration
cd exstrat_backend
npx prisma migrate dev --name add_email_to_user

# Résultat :
# - Crée un fichier dans prisma/migrations/
# - Applique les changements à votre DB locale
# - Génère le Prisma Client
```

### 2. Déploiement en Production

```bash
# Sur Railway (après le push de votre code) :
# Railway exécute automatiquement dans le build :
npm install
npm run build
npx prisma generate      # Génère le client
npx prisma migrate deploy # Applique les migrations existantes
```

---

## ⚠️ Pourquoi cette Différence ?

### `prisma migrate dev`
- **Interaction** : Peut vous poser des questions
- **Sécurité** : Peut réinitialiser la DB en développement
- **Création** : Crée de nouvelles migrations
- **Use case** : Développement actif

### `prisma migrate deploy`
- **Silencieux** : Pas d'interaction, pas de questions
- **Sécurité** : Ne supprime jamais de données
- **Application seule** : N'applique que les migrations existantes
- **Use case** : Déploiement automatique, CI/CD

---

## 🛠️ Commandes Prisma Utiles

### En Local

```bash
# Créer une migration avec nom
npx prisma migrate dev --name description_du_changement

# Réinitialiser la base (⚠️ supprime toutes les données)
npx prisma migrate reset

# Voir l'état des migrations
npx prisma migrate status

# Ouvrir Prisma Studio (interface graphique)
npx prisma studio

# Générer le client (après changement de schéma)
npx prisma generate
```

### En Production

```bash
# Appliquer les migrations (automatique dans Railway)
npx prisma migrate deploy

# Générer le client (automatique aussi)
npx prisma generate

# Voir l'état des migrations
npx prisma migrate status
```

---

## 📝 Exemple Concret

### Scénario : Ajouter un champ `description` au modèle Portfolio

**En Local :**
1. Modifiez `schema.prisma` :
```prisma
model Portfolio {
  id          String   @id @default(cuid())
  name        String
  description String?  // ← Nouveau champ
  // ...
}
```

2. Créez la migration :
```bash
npx prisma migrate dev --name add_description_to_portfolio
```
→ Crée `prisma/migrations/20250102120000_add_description_to_portfolio/migration.sql`
→ Applique à votre DB locale

3. Commitez et poussez sur GitHub

**En Production (Railway) :**
1. Railway détecte le nouveau commit
2. Build automatique :
```bash
npm install
npm run build
npx prisma generate
npx prisma migrate deploy  # ← Applique la nouvelle migration
```
→ La migration créée en local est appliquée à la DB de production

---

## 🔐 Sécurité

### ⚠️ Ne JAMAIS utiliser `prisma migrate dev` en production

**Pourquoi ?**
- Peut créer des migrations inattendues
- Peut réinitialiser la base de données
- N'est pas prévu pour un environnement non-interactif

### ✅ Toujours utiliser `prisma migrate deploy` en production

**Pourquoi ?**
- Applique uniquement les migrations validées en local
- Ne crée jamais de nouvelles migrations
- Fonctionne de manière silencieuse (pas d'interaction)
- Sécurisé pour les déploiements automatiques

---

## 📦 Dans package.json

J'ai ajouté ces scripts pour faciliter le déploiement :

```json
{
  "scripts": {
    "postinstall": "prisma generate",  // Génère automatiquement après npm install
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate deploy"  // Pour la production
  }
}
```

Railway exécutera automatiquement `postinstall`, donc Prisma Client sera généré à chaque build !

---

## 🎯 Résumé

| Aspect | `prisma migrate dev` | `prisma migrate deploy` |
|--------|---------------------|------------------------|
| **Où** | Local uniquement | Production |
| **Crée migrations** | ✅ Oui | ❌ Non |
| **Applique migrations** | ✅ Oui | ✅ Oui |
| **Génère Prisma Client** | ✅ Oui | ✅ Oui |
| **Interaction** | Oui (questions) | Non (silencieux) |
| **Sécurité** | Peut réinitialiser | Sécurisé |

**Règle d'or :** Toujours créer les migrations en local avec `dev`, puis déployer avec `deploy` en production ! 🚀

