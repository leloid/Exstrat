# 📧 Configuration Resend pour Railway (Production)

## ⚠️ Problème : Les emails ne fonctionnent pas en production

Si les emails de vérification ne sont pas envoyés en production, c'est probablement parce que les variables d'environnement Resend ne sont pas configurées dans Railway.

## 🔧 Solution : Ajouter les variables Resend dans Railway

### Étape 1 : Obtenir votre clé API Resend

1. Connectez-vous à [Resend Dashboard](https://resend.com/api-keys)
2. Créez une nouvelle clé API ou copiez une clé existante
3. La clé commence par `re_...`

### Étape 2 : Configurer dans Railway

1. **Allez dans Railway → Votre Service Backend → Variables**
2. **Ajoutez les variables suivantes** :

```
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=contact@exstrat.io
```

⚠️ **Important** :
- Remplacez `re_xxxxxxxxxxxxx` par votre vraie clé API Resend
- Remplacez `contact@exstrat.io` par l'adresse email de votre domaine vérifié dans Resend
- Si votre domaine n'est pas encore vérifié, utilisez temporairement `onboarding@resend.dev` pour tester

### Étape 3 : Vérifier le domaine dans Resend

1. Allez sur [Resend Domains](https://resend.com/domains)
2. Vérifiez que votre domaine (ex: `exstrat.io`) est bien vérifié
3. Si ce n'est pas le cas, suivez les instructions pour ajouter les enregistrements DNS

### Étape 4 : Redéployer

Après avoir ajouté les variables :
1. Railway redéploiera automatiquement
2. Ou allez dans **Deployments** → Cliquez sur **"Redeploy"**

### Étape 5 : Vérifier les logs

1. Railway → Votre Service → **Logs**
2. Cherchez les messages suivants :
   - ✅ `Resend email service initialized successfully` → Configuration OK
   - ❌ `RESEND_API_KEY not found` → Variable manquante
   - ❌ `Error sending verification email` → Vérifiez les détails de l'erreur

## 🧪 Test rapide avec domaine Resend

Si vous voulez tester rapidement sans vérifier votre domaine :

1. Dans Railway → Variables, modifiez :
   ```
   RESEND_FROM_EMAIL=onboarding@resend.dev
   ```

2. Redéployez

3. Testez l'envoi d'email

4. Vérifiez dans [Resend Dashboard](https://resend.com/emails) que l'email apparaît

## 📋 Checklist de Configuration

- [ ] `RESEND_API_KEY` ajoutée dans Railway
- [ ] `RESEND_FROM_EMAIL` ajoutée dans Railway
- [ ] Domaine vérifié dans Resend (ou utilisation de `onboarding@resend.dev` pour tester)
- [ ] Service redéployé après ajout des variables
- [ ] Logs vérifiés pour confirmer l'initialisation
- [ ] Test d'envoi d'email effectué

## 🔍 Dépannage

### Erreur : "RESEND_API_KEY not found"
- **Cause** : Variable non configurée dans Railway
- **Solution** : Ajoutez `RESEND_API_KEY` dans Railway → Variables

### Erreur : "Domain not verified"
- **Cause** : Le domaine dans `RESEND_FROM_EMAIL` n'est pas vérifié dans Resend
- **Solution** : Vérifiez le domaine dans Resend ou utilisez `onboarding@resend.dev` temporairement

### Emails envoyés mais non reçus
- Vérifiez dans [Resend Dashboard](https://resend.com/emails) si l'email apparaît
- Si oui, le problème vient de la réception (spam, etc.)
- Si non, vérifiez les logs pour les erreurs Resend

## 📚 Documentation

- [Resend API Keys](https://resend.com/api-keys)
- [Resend Domains](https://resend.com/domains)
- [Resend Testing Addresses](https://resend.com/docs/knowledge-base/what-email-addresses-to-use-for-testing)

