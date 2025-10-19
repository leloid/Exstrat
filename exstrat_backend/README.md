0) TL;DR

Exstrat V1 = web app qui :

connecte des exchanges (Binance/Coinbase via clés API read-only),

ingère balances, trades, dépôts/retraits,

normalise et calcule positions + prix moyen + valo,

permet de créer des stratégies de prise de profit (paliers % → % à vendre),

surveille les prix et notifie quand un palier est atteint.

Stack : Next.js (front) + NestJS (API) + PostgreSQL + Prisma + CCXT + BullMQ/Redis.
Déploiement : Vercel (front) / Render ou Railway (back) / Redis managé.

1) Portée V1 (Scope)

Exchanges supportés : Binance (spot), Coinbase (Spot/Advanced Trade).

Auth email/password + JWT (cookie httpOnly).

Ingestion via CCXT : balances, trades, dépôts/retraits (lecture seule).

Calculs : quantité par asset, prix moyen pondéré d’achat, valeur actuelle en USDT/USDC.

Stratégies par token : paliers (ex. +10% → vendre 20%; +40% → vendre 59%).

Alertes (in-app + email) quand prix ≥ cible.

Dashboard global + page détail token + liste/fiche stratégies.

Pas d’exécution d’ordres en V1 (alert-only). (Option V1.1 : exécution via CCXT).

Hors scope V1 : wallets on-chain, import CSV, multi-devises complexes, rôles avancés.

2) Parcours utilisateur (V1)

S’inscrire / se connecter.

Ajouter un exchange (API key/secret[/passphrase]) → test de connexion.

Lancer la synchronisation → balances & trades ingérés.

Voir Portfolio consolidé : quantité, prix moyen, valeur actuelle par token.

Créer une stratégie sur 1 token (référence = prix moyen ou prix custom).

Le worker prix surveille → alerte quand palier atteint.

3) Architecture (résumé)

Frontend (Next.js, App Router) : pages /login, /portfolio, /tokens/[symbol], /strategies. Data fetching via React Query; cookies (JWT httpOnly) pour auth.

Backend (NestJS) : modules auth, exchange-accounts, ingestion, portfolio, prices, strategies, notifications.

DB (PostgreSQL + Prisma) : tables User, ExchangeAccount, Balance, Trade, Transfer, Position, Strategy, StrategyStep, StrategyExecution.

CCXT : accès exchanges (fetchBalance, fetchMyTrades, fetchDeposits/Withdrawals).

BullMQ + Redis : jobs ingestion + surveillance prix (idempotence).

Provider prix : Binance spot (public) + cache 30–60s.

(Le diagramme est prêt : architecture_v1.png/pdf.)

4) Modèle de données (Prisma – extrait minimal)
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  accounts  ExchangeAccount[]
  strategies Strategy[]
}

model ExchangeAccount {
  id        String   @id @default(cuid())
  userId    String
  exchange  String   // 'binance' | 'coinbase'
  apiKey    String   // chiffré
  apiSecret String   // chiffré
  apiPass   String?  // coinbase/kraken
  nickname  String?
  status    String   @default("connected") // connected | error | syncing
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  balances  Balance[]
  trades    Trade[]
  transfers Transfer[]
}

model Balance {
  id        String   @id @default(cuid())
  exchangeAccountId String
  asset     String
  free      Decimal  @db.Decimal(38,18)
  locked    Decimal  @db.Decimal(38,18)
  fetchedAt DateTime
  account   ExchangeAccount @relation(fields: [exchangeAccountId], references: [id])
}

model Trade {
  id        String   @id @default(cuid())
  exchangeAccountId String
  symbol    String   // 'ETH/USDT'
  side      String   // buy | sell
  price     Decimal  @db.Decimal(38,18)
  amount    Decimal  @db.Decimal(38,18)
  cost      Decimal? @db.Decimal(38,18) // price*amount
  feeAsset  String?
  feeCost   Decimal? @db.Decimal(38,18)
  txId      String?  // exchange trade id
  ts        DateTime
  account   ExchangeAccount @relation(fields: [exchangeAccountId], references: [id])
  @@index([exchangeAccountId, symbol, ts])
}

model Transfer {
  id        String   @id @default(cuid())
  exchangeAccountId String
  type      String   // deposit | withdrawal
  asset     String
  amount    Decimal  @db.Decimal(38,18)
  feeCost   Decimal? @db.Decimal(38,18)
  ts        DateTime
  account   ExchangeAccount @relation(fields: [exchangeAccountId], references: [id])
}

model Position {
  id        String   @id @default(cuid())
  userId    String
  asset     String
  quantity  Decimal  @db.Decimal(38,18)
  avgPrice  Decimal  @db.Decimal(38,18) // en USDT/USDC
  updatedAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  @@unique([userId, asset])
}

model Strategy {
  id        String   @id @default(cuid())
  userId    String
  asset     String
  baseQty   Decimal  @db.Decimal(38,18) // qty de référence (ex: 4 ETH)
  refPrice  Decimal  @db.Decimal(38,18) // prix de référence (avgPrice ou custom)
  status    String   @default("active") // active | paused | completed
  exchangeAccountId String?
  steps     StrategyStep[]
  user      User     @relation(fields: [userId], references: [id])
}

model StrategyStep {
  id         String  @id @default(cuid())
  strategyId String
  targetPct  Decimal @db.Decimal(10,4) // +10 => 10
  sellPct    Decimal @db.Decimal(10,4) // 20 => 20% de baseQty
  targetPrice Decimal @db.Decimal(38,18)
  state      String  @default("pending") // pending | triggered | done
  triggeredAt DateTime?
  strategy   Strategy @relation(fields: [strategyId], references: [id])
  @@index([strategyId, targetPrice])
}

model StrategyExecution {
  id         String   @id @default(cuid())
  strategyId String
  stepId     String
  executedQty Decimal @db.Decimal(38,18)
  executionType String // 'alert' (V1) | 'order'
  status     String    @default("created")
  createdAt  DateTime  @default(now())
}

5) Calculs & règles de gestion

Prix moyen (WAP) :
avgPrice = (Σ achats_net_en_quote ± frais_en_quote) / Σ quantité_détenue

Les transferts n’entrent pas dans le coût (changent la localisation, pas le coût).

Méthode moyenne pondérée (pas FIFO) pour V1.

Valo : valo = quantity * dernier_prix(ASSET/USDT|USDC).

Stratégie :
targetPrice = refPrice * (1 + targetPct/100)
qtyToSellStep = baseQty * (sellPct/100) → arrondir à la lot size exchange.
Un step se déclenche une seule fois (state → triggered/done).

Provider prix : unique (Binance spot), cache 30–60s, backoff en cas d’erreur.

6) API (contrats principaux)
Auth

POST /auth/signup { email, password } → 201

POST /auth/login { email, password } → Set-Cookie (JWT httpOnly)

POST /auth/logout → clear cookie

Exchanges

POST /exchanges { exchange, apiKey, apiSecret, apiPass? } → test + save

POST /exchanges/:id/sync → enqueue jobs (balances, trades, transfers)

GET /exchanges → liste

Portfolio / Prices

GET /portfolio?quote=USDT → [ { asset, quantity, avgPrice, value } ]

GET /tokens/:asset → { trades, transfers, position, pnl }

GET /prices?assets=ETH,BTC&quote=USDT → tickers

Stratégies

POST /strategies

{
  "asset":"ETH",
  "reference":{"type":"avgPrice"}, // ou {"type":"custom","price":2100}
  "baseQty":"4",
  "exchangeAccountId": null,
  "steps":[{"targetPct":10,"sellPct":20},{"targetPct":40,"sellPct":59}],
  "notify":{"email":true,"inApp":true}
}


GET /strategies | GET /strategies/:id

POST /strategies/:id/pause|resume|complete

Réponses : JSON simples, champs en camelCase.

7) Workers (BullMQ)

Queues :

ingest:balances, ingest:trades, ingest:transfers

watch:price:<asset> (un job cyclique par asset actif)

Idempotence :

clé de dédoublonnage (jobId = ${exchange}:${account}:${type}:${cursor})

pour les steps : lock Redis step:${stepId} + champ state.

Pseudocode « déclencheur de step » :

const last = await prices.get("ETH/USDT"); // provider unique
for (const step of repo.pendingSteps("ETH")) {
  if (last >= step.targetPrice) {
    if (await lock(`step:${step.id}`)) {
      await repo.markTriggered(step.id, new Date());
      const qty = roundToLotSize(strategy.baseQty * step.sellPct/100, lotSize);
      await repo.createExecution({ strategyId: step.strategyId, stepId: step.id, executedQty: qty, executionType: 'alert' });
      await notifier.send({ userId: strategy.userId, asset: 'ETH', step, price: last });
      await unlock(`step:${step.id}`);
    }
  }
}

8) Frontend (Next.js – App Router)

Pages :

/login (auth)

/portfolio (tableau : asset, qty, avgPrice, value)

/tokens/[symbol] (détail : trades, transferts, P&L)

/strategies (liste + statut)

Dialog “Créer une stratégie” depuis /portfolio (prérempli avec avgPrice, baseQty = position courante).

Tech :

React Query pour appels API + cache.

Zod pour valider formulaires (stratégie).

JWT cookie (httpOnly) → fetch API avec credentials: 'include'.

9) Sécurité

Clés API chiffrées at-rest (AES-GCM, secret côté serveur / KMS).

Stocker read-only uniquement en V1.

JWT signé (RS256 si possible), cookie httpOnly + SameSite=Lax.

Rate limit de l’API publique (ex. 100 req/5min/user).

Logs sans secrets.

10) Variables d’environnement (exemples)

Backend

DATABASE_URL=postgresql://user:pass@host:5432/exstrat
JWT_SECRET=change-me
ENCRYPTION_KEY=32-bytes-hex-ou-base64
REDIS_URL=redis://:pass@host:6379
PRICE_PROVIDER=binance


Frontend

NEXT_PUBLIC_API_BASE_URL=https://api.exstrat.com

11) Déploiement

Front : Vercel (prévoir NEXT_PUBLIC_API_BASE_URL).

Back : Render/Railway (Docker ou Node 20), migrations Prisma au start.

Redis managé.

Cron (ou worker always-on) pour watch:price:*.

12) Logs & Tests

Pino (back) + correlation id par requête.

Tests unitaires sur calcul avgPrice et déclenchement steps.

Tests d’intégration CCXT mockés (nock).

13) Arborescences

NestJS

src/
  main.ts
  app.module.ts
  auth/
  exchanges/
  ingestion/
  portfolio/
  prices/
  strategies/
  notifications/
  common/
prisma/
  schema.prisma


Next.js (App Router)

app/
  login/page.tsx
  portfolio/page.tsx
  tokens/[symbol]/page.tsx
  strategies/page.tsx
components/
lib/api.ts      // fetch wrapper (credentials: include)

14) Conventions

TypeScript strict, ESLint + Prettier.

DTOs NestJS avec class-validator.

API JSON camelCase, codes HTTP corrects, messages d’erreur clairs.

Les montants/quantités toujours en Decimal (côté DB) et string dans l’API (éviter perte de précision).

15) Edges & pièges

Mapping symboles (ETH/USDT vs ETH-USDT selon exchange — CCXT standardise, mais vérifier).

Précisions/lot size différentes par exchange → arrondir.

Trades manquants / pagination : boucler jusqu’à épuisement (since, limit).

Fuseau de prix unique (éviter mélanger plusieurs sources).

Changement de position après création d’une stratégie : V1 fige baseQty; on n’auto-ajuste pas.

16) Exemple utilisateur (ETH)

Position : 4.00 ETH @ 2000 USDT (avg).

Stratégie :

+10% (2200) → vendre 20% = 0.80 ETH

+40% (2800) → vendre 59% = 2.36 ETH

Worker surveille prix Binance → alerte quand 2200 puis 2800 sont atteints.

Reste après deux paliers : 0.84 ETH.