-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExchangeAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "apiSecret" TEXT NOT NULL,
    "apiPass" TEXT,
    "nickname" TEXT,
    "status" TEXT NOT NULL DEFAULT 'connected',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Balance" (
    "id" TEXT NOT NULL,
    "exchangeAccountId" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "free" DECIMAL(38,18) NOT NULL,
    "locked" DECIMAL(38,18) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Trade" (
    "id" TEXT NOT NULL,
    "exchangeAccountId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "price" DECIMAL(38,18) NOT NULL,
    "amount" DECIMAL(38,18) NOT NULL,
    "cost" DECIMAL(38,18),
    "feeAsset" TEXT,
    "feeCost" DECIMAL(38,18),
    "txId" TEXT,
    "ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Transfer" (
    "id" TEXT NOT NULL,
    "exchangeAccountId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "amount" DECIMAL(38,18) NOT NULL,
    "feeCost" DECIMAL(38,18),
    "ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Position" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "quantity" DECIMAL(38,18) NOT NULL,
    "avgPrice" DECIMAL(38,18) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Strategy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "baseQty" DECIMAL(38,18) NOT NULL,
    "refPrice" DECIMAL(38,18) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "exchangeAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Strategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StrategyStep" (
    "id" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "targetPct" DECIMAL(10,4) NOT NULL,
    "sellPct" DECIMAL(10,4) NOT NULL,
    "targetPrice" DECIMAL(38,18) NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "triggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategyStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StrategyExecution" (
    "id" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "executedQty" DECIMAL(38,18) NOT NULL,
    "executionType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'created',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrategyExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cmcId" INTEGER NOT NULL,
    "quantity" DECIMAL(38,18) NOT NULL,
    "amountInvested" DECIMAL(38,18) NOT NULL,
    "averagePrice" DECIMAL(38,18) NOT NULL,
    "type" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "exchangeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Trade_exchangeAccountId_symbol_ts_idx" ON "public"."Trade"("exchangeAccountId", "symbol", "ts");

-- CreateIndex
CREATE UNIQUE INDEX "Position_userId_asset_key" ON "public"."Position"("userId", "asset");

-- CreateIndex
CREATE INDEX "StrategyStep_strategyId_targetPrice_idx" ON "public"."StrategyStep"("strategyId", "targetPrice");

-- CreateIndex
CREATE INDEX "Transaction_userId_symbol_idx" ON "public"."Transaction"("userId", "symbol");

-- CreateIndex
CREATE INDEX "Transaction_userId_transactionDate_idx" ON "public"."Transaction"("userId", "transactionDate");

-- CreateIndex
CREATE INDEX "Transaction_userId_type_idx" ON "public"."Transaction"("userId", "type");

-- AddForeignKey
ALTER TABLE "public"."ExchangeAccount" ADD CONSTRAINT "ExchangeAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Balance" ADD CONSTRAINT "Balance_exchangeAccountId_fkey" FOREIGN KEY ("exchangeAccountId") REFERENCES "public"."ExchangeAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Trade" ADD CONSTRAINT "Trade_exchangeAccountId_fkey" FOREIGN KEY ("exchangeAccountId") REFERENCES "public"."ExchangeAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transfer" ADD CONSTRAINT "Transfer_exchangeAccountId_fkey" FOREIGN KEY ("exchangeAccountId") REFERENCES "public"."ExchangeAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Position" ADD CONSTRAINT "Position_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Strategy" ADD CONSTRAINT "Strategy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StrategyStep" ADD CONSTRAINT "StrategyStep_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "public"."Strategy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
