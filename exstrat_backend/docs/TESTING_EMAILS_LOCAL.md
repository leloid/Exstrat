# Tester les emails en local

## 1. Configuration

Dans ton `.env` (à la racine du backend) :

```env
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev
```

- **Clé API** : crée un compte sur [resend.com](https://resend.com), puis récupère une clé dans *API Keys*.
- En dev, tu peux utiliser le domaine par défaut Resend (`onboarding@resend.dev`) ou un domaine vérifié.

Sans `RESEND_API_KEY`, le backend logue un warning et n’envoie aucun email.

---

## 2. Endpoints de test (sans passer par les alertes réelles)

Backend démarré (`npm run start:dev`), tu peux envoyer des emails de test avec `curl` ou Postman.

### Alerte stratégie (générique)

```bash
curl -X POST http://localhost:3000/email/test/strategy-alert \
  -H "Content-Type: application/json" \
  -d '{"email": "ton@email.com"}'
```

Sans body, l’email part vers `delivered@resend.dev` (visible dans le dashboard Resend → Logs).

### Alerte step : Before TP

Simule l’email “X% avant le TP” :

```bash
curl -X POST http://localhost:3000/email/test/step-alert \
  -H "Content-Type: application/json" \
  -d '{"email": "ton@email.com", "type": "beforeTP"}'
```

### Alerte step : TP reached

Simule l’email “TP atteint” :

```bash
curl -X POST http://localhost:3000/email/test/step-alert \
  -H "Content-Type: application/json" \
  -d '{"email": "ton@email.com", "type": "tpReached"}'
```

Tu peux omettre `email` pour utiliser `delivered@resend.dev`.

---

## 3. Vérifier la réception

- **Avec ton adresse** : regarde ta boîte mail (et spams).
- **Avec `delivered@resend.dev`** : va sur [Resend → Logs](https://resend.com/emails) et vérifie que l’email apparaît.

---

## 4. Tester le flux complet (alertes réelles)

Pour tester **before TP** et **TP reached** comme en prod (prix → alerte → queue → email) :

1. **Redis** doit tourner (pour la queue et les locks).
2. **Base** : au moins une stratégie active avec des steps et des StepAlerts (before TP et/ou TP reached activés, email activé dans les paramètres de la stratégie).
3. Le **scheduler** tourne toutes les 60 s et met les tokens à vérifier dans la queue `price-check`.
4. Le **worker** `price-check` récupère les prix (CoinMarketCap), puis appelle `checkAlertsForToken` pour chaque token.
5. Si les conditions sont remplies, un job `send-step-alert` est ajouté à la queue `send-email`.
6. Le **worker** `send-email` envoie l’email et met à jour `beforeTPEmailSentAt` ou `tpReachedEmailSentAt`.

Pour forcer un cas sans attendre le vrai prix :

- Soit tu mocks temporairement le prix dans le code (ex. dans `price.service.ts` ou dans le test du worker).
- Soit tu ajoutes un endpoint de dev qui enqueue un job `send-step-alert` avec des données de test (à ne pas exposer en prod).

En local, le plus simple reste d’utiliser les endpoints **/email/test/strategy-alert** et **/email/test/step-alert** pour vérifier que le contenu et la livraison des mails before TP et TP reached fonctionnent bien.
