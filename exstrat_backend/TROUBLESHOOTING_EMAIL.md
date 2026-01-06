# 🔧 Dépannage des emails - Guide complet

## ❌ Problème : Les emails ne sont pas envoyés / n'apparaissent pas dans Resend

### ✅ Vérifications à faire

#### 1. Vérifier que le domaine est vérifié dans Resend

**C'est probablement le problème principal !**

1. Connectez-vous à [Resend Dashboard](https://resend.com/domains)
2. Allez dans **"Domains"**
3. Vérifiez si `exstrat.io` est listé et **vérifié** (statut "Verified" avec une coche verte)

**Si le domaine n'est pas vérifié :**
- Resend **rejette silencieusement** les emails
- Les emails n'apparaissent pas dans le dashboard
- Aucune erreur n'est retournée (c'est pourquoi vous voyez `success: true`)

**Solution :**
1. Ajoutez le domaine `exstrat.io` dans Resend
2. Configurez les enregistrements DNS (SPF, DKIM, DMARC)
3. Attendez la vérification (peut prendre quelques minutes)

**Alternative pour tester rapidement :**
- Utilisez le domaine de test Resend : `onboarding@resend.dev`
- Modifiez temporairement `RESEND_FROM_EMAIL=onboarding@resend.dev` dans `.env`

#### 2. Vérifier les logs du backend

Après avoir amélioré le logging, vous devriez voir :

**Si ça fonctionne :**
```
[EmailService] Attempting to send strategy alert email to lahcen.elouardi@outlook.fr from contact@exstrat.io
[EmailService] Strategy alert email sent successfully to lahcen.elouardi@outlook.fr. Resend ID: abc123...
```

**Si ça échoue :**
```
[EmailService] Error sending strategy alert email to lahcen.elouardi@outlook.fr: [error details]
[EmailService] Error details: { message: "...", response: {...}, status: 422 }
```

#### 3. Vérifier la configuration `.env`

```bash
# Vérifiez que ces variables sont bien définies
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=contact@exstrat.io
```

#### 4. Tester avec le domaine Resend (solution rapide)

Pour tester **immédiatement** sans configurer votre domaine :

1. Modifiez temporairement `.env` :
```bash
RESEND_FROM_EMAIL=onboarding@resend.dev
```

2. Redémarrez le backend

3. Testez à nouveau :
```bash
curl -X POST http://localhost:3000/email/test/strategy-alert \
  -H "Content-Type: application/json" \
  -d '{"email": "lahcen.elouardi@outlook.fr"}'
```

4. Vérifiez dans [Resend Dashboard](https://resend.com/emails) - vous devriez voir l'email !

#### 5. Vérifier les erreurs Resend dans les logs

Les erreurs communes :

**422 - Domain not verified**
```
Error details: {
  message: "Domain not verified",
  status: 422
}
```
→ Le domaine `exstrat.io` n'est pas vérifié dans Resend

**403 - Invalid API key**
```
Error details: {
  message: "Invalid API key",
  status: 403
}
```
→ La clé API est incorrecte ou expirée

**400 - Invalid from address**
```
Error details: {
  message: "Invalid from address",
  status: 400
}
```
→ L'adresse `from` n'est pas valide ou non autorisée

## 🎯 Solution rapide : Utiliser le domaine de test Resend

Pour tester **maintenant** sans configurer votre domaine :

1. **Modifiez `.env`** :
```bash
RESEND_FROM_EMAIL=onboarding@resend.dev
```

2. **Redémarrez le backend**

3. **Testez** :
```bash
curl -X POST http://localhost:3000/email/test/strategy-alert \
  -H "Content-Type: application/json" \
  -d '{"email": "lahcen.elouardi@outlook.fr"}'
```

4. **Vérifiez dans Resend Dashboard** - l'email devrait apparaître !

## 📋 Checklist de vérification

- [ ] Le domaine `exstrat.io` est vérifié dans Resend Dashboard
- [ ] Les enregistrements DNS (SPF, DKIM) sont configurés
- [ ] `RESEND_API_KEY` est correct dans `.env`
- [ ] `RESEND_FROM_EMAIL` correspond à un domaine vérifié
- [ ] Les logs du backend montrent des erreurs détaillées
- [ ] L'email apparaît dans Resend Dashboard après envoi

## 🔍 Comment vérifier le statut du domaine

1. Allez sur [Resend Domains](https://resend.com/domains)
2. Cliquez sur votre domaine `exstrat.io`
3. Vérifiez que tous les enregistrements DNS sont **vérifiés** (coche verte)
4. Si un enregistrement est en attente, attendez quelques minutes et rafraîchissez

## 💡 Pourquoi `success: true` mais pas d'email ?

Si votre endpoint retourne `success: true` mais que :
- L'email n'apparaît pas dans Resend Dashboard
- L'email n'arrive pas dans la boîte mail

C'est probablement parce que :
1. **Le domaine n'est pas vérifié** → Resend rejette silencieusement
2. **L'erreur n'est pas capturée** → Le code retourne `success` avant que Resend ne rejette

**Solution :** Utilisez le logging amélioré pour voir les erreurs Resend dans les logs du backend.

## 🚀 Prochaines étapes

1. **Testez avec `onboarding@resend.dev`** pour confirmer que le code fonctionne
2. **Vérifiez votre domaine dans Resend** et configurez les DNS si nécessaire
3. **Une fois le domaine vérifié**, remettez `RESEND_FROM_EMAIL=contact@exstrat.io`
4. **Testez à nouveau** - les emails devraient maintenant apparaître dans Resend Dashboard


