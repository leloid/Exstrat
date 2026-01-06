# Test de l'envoi d'emails

## 🧪 Méthodes de test

### 📧 Adresses de test Resend (Recommandé)

Resend fournit des adresses spéciales pour tester sans affecter votre réputation :

| Adresse | Événement simulé |
|---------|------------------|
| `delivered@resend.dev` | Email délivré avec succès ✅ |
| `bounced@resend.dev` | Email qui rebondit (bounce) ❌ |
| `complained@resend.dev` | Email marqué comme spam 🚫 |

**Support des labels** : Vous pouvez ajouter un label après le `+` pour différencier vos tests :
- `delivered+test1@resend.dev`
- `delivered+strategy@resend.dev`
- `delivered+tp@resend.dev`

> ⚠️ **Important** : N'utilisez **PAS** `@example.com` ou `@test.com` - Resend les bloque et retourne une erreur 422.

**Documentation** : [Resend Testing Addresses](https://resend.com/docs/knowledge-base/what-email-addresses-to-use-for-testing)

### Méthode 1 : Via l'API (Recommandé)

#### 1. Démarrez le backend

```bash
cd exstrat_backend
npm run start:dev
```

#### 2. Testez l'email d'alerte de stratégie

```bash
# ⚠️ Pour les tests, l'authentification est désactivée
# Utilisez une adresse de test Resend (recommandé) ou votre email

# Avec adresse de test Resend (recommandé)
curl -X POST http://localhost:3000/email/test/strategy-alert \
  -H "Content-Type: application/json" \
  -d '{"email": "delivered@resend.dev"}'

# Ou avec votre email
curl -X POST http://localhost:3000/email/test/strategy-alert \
  -H "Content-Type: application/json" \
  -d '{"email": "votre-email@example.com"}'

# Ou sans body (utilise delivered@resend.dev par défaut)
curl -X POST http://localhost:3000/email/test/strategy-alert \
  -H "Content-Type: application/json"
```

#### 3. Testez l'email d'alerte de TP

```bash
# Avec adresse de test Resend
curl -X POST http://localhost:3000/email/test/tp-alert \
  -H "Content-Type: application/json" \
  -d '{"email": "delivered@resend.dev"}'

# Ou avec votre email
curl -X POST http://localhost:3000/email/test/tp-alert \
  -H "Content-Type: application/json" \
  -d '{"email": "votre-email@example.com"}'
```

#### 4. Utilisez le script de test (Plus simple)

```bash
# Test email de stratégie avec adresse Resend
node test-email.js delivered@resend.dev strategy

# Test email de TP avec adresse Resend
node test-email.js delivered@resend.dev tp

# Ou avec votre email
node test-email.js votre-email@example.com strategy
```

### Méthode 2 : Via Postman ou Insomnia

1. Créez une nouvelle requête POST
2. URL : `http://localhost:3000/email/test/strategy-alert`
3. Headers :
   - `Content-Type: application/json`
   - ⚠️ Pas besoin d'Authorization pour les tests
4. Body (JSON) :
```json
{
  "email": "delivered@resend.dev"
}
```

Ou laissez le body vide pour utiliser l'adresse par défaut (`delivered@resend.dev`).

### Méthode 3 : Script de test Node.js (Recommandé)

Le script `test-email.js` est déjà créé dans le dossier `exstrat_backend/`.

Utilisation :
```bash
cd exstrat_backend
node test-email.js votre-email@example.com strategy
# ou
node test-email.js votre-email@example.com tp
```

## 🔍 Vérification

### 1. Vérifiez les logs du backend

Vous devriez voir :
```
[EmailService] Strategy alert email sent to votre-email@example.com
```

### 2. Vérifiez votre boîte mail

- Vérifiez les spams si l'email n'arrive pas
- L'email devrait avoir le design Exstrat avec les couleurs orange et bleu

### 3. Vérifiez Resend Dashboard

- Connectez-vous à [Resend Dashboard](https://resend.com/emails)
- Vous devriez voir les emails envoyés avec leur statut

## ⚠️ Dépannage

### L'email n'arrive pas

1. **Vérifiez RESEND_API_KEY** dans `.env`
2. **Vérifiez RESEND_FROM_EMAIL** - doit être un domaine vérifié dans Resend
3. **Vérifiez les logs** pour les erreurs Resend
4. **Vérifiez les spams**

### Erreur "Domain not verified"

Dans Resend :
1. Allez dans "Domains"
2. Ajoutez votre domaine ou utilisez le domaine de test fourni
3. Vérifiez les enregistrements DNS

### Erreur "Unauthorized"

- ⚠️ Pour les tests, l'authentification est désactivée dans `email.controller.ts`
- En production, décommentez `@UseGuards(JwtAuthGuard)` dans le contrôleur

## 📧 Format des emails

Les emails incluent :
- Design Exstrat (couleurs orange #F6851B et bleu #047DD5)
- Informations sur le token et le prix
- Bouton pour voir la stratégie/forecast
- Responsive design

## 🚀 Prochaines étapes

Une fois les tests réussis, le système d'alertes enverra automatiquement des emails quand :
- Un target price de stratégie est atteint
- Un TP d'alerte est atteint

Les emails sont envoyés via la queue BullMQ pour une meilleure performance.

