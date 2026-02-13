# Comment fonctionnent les alertes

## Principe (résumé)

1. **Toutes les X secondes** (par défaut 60 s), un cron lance la vérification.
2. On récupère **tous les tokens qui ont au moins une alerte active** (before TP ou TP reached).
3. On récupère le **prix actuel** de ces tokens via **CoinMarketCap** (batch).
4. Pour chaque token et chaque **StepAlert** associée :
   - **Before TP** : si l’alerte "before" est activée et que le **prix actuel est dans la zone "X % avant le TP"** (ex. entre 98 % et 100 % du target) et qu’on n’a pas déjà envoyé l’email → on envoie un email.
   - **TP reached** : si l’alerte "TP reached" est activée et que le **prix actuel est >= prix cible (TP)** et qu’on n’a pas déjà envoyé l’email → on envoie un email.

Donc oui : on regarde toutes les alertes actives, on récupère les prix des tokens concernés (CoinMarketCap), et on envoie un mail quand la condition est remplie (before = dans la zone X % avant le TP ; reached = prix >= TP).

---

## Dépendance : Redis obligatoire

Les files d’attente (Bull) et les locks anti-doublon utilisent **Redis**. Si Redis n’est pas disponible, tu vois dans les logs :

- `[ioredis] Unhandled error event: AggregateError [ECONNREFUSED]`
- `PriceCheckerScheduler - Error in scheduled price check: MaxRetriesPerRequestError`

**À faire :**

- **En local** : lancer Redis (ex. `docker run -d -p 6379:6379 redis` ou Redis installé en natif).
- **Sur Railway** (ou autre hébergeur) :
  - Ajouter un service **Redis** (Railway propose un plugin Redis).
  - Définir **`REDIS_URL`** (recommandé : le backend et Bull l’utilisent tous les deux). Sinon `REDIS_HOST` + `REDIS_PORT` (+ `REDIS_PASSWORD` si besoin).

Sans Redis, le cron trouve bien les tokens avec alertes actives mais **ne peut pas ajouter les jobs** dans la queue ni utiliser les locks, donc les alertes ne partent pas.

---

## Récap des conditions d’envoi

| Type       | Condition d’envoi                                      | Email déjà envoyé ?      |
|-----------|--------------------------------------------------------|---------------------------|
| **Before TP** | Prix actuel ≥ (TP × (1 − X/100)) **et** prix actuel < TP | Non (`beforeTPEmailSentAt` vide) |
| **TP reached** | Prix actuel ≥ TP                                       | Non (`tpReachedEmailSentAt` vide) |

Après envoi, on met à jour la date en base pour ne pas renvoyer pour ce step.
