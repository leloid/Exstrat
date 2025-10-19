-- CreateTable
CREATE TABLE "public"."Portfolio" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Token" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cmcId" INTEGER,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Holding" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "quantity" DECIMAL(38,18) NOT NULL,
    "investedAmount" DECIMAL(38,18) NOT NULL,
    "averagePrice" DECIMAL(38,18) NOT NULL,
    "currentPrice" DECIMAL(38,18),
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Holding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StrategyTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategyTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfitTakingTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rules" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfitTakingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserStrategy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TokenStrategyConfiguration" (
    "id" TEXT NOT NULL,
    "userStrategyId" TEXT NOT NULL,
    "holdingId" TEXT NOT NULL,
    "strategyTemplateId" TEXT,
    "profitTakingTemplateId" TEXT,
    "customProfitTakingRules" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenStrategyConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SimulationResult" (
    "id" TEXT NOT NULL,
    "userStrategyId" TEXT NOT NULL,
    "tokenStrategyConfigId" TEXT NOT NULL,
    "projectedValue" DECIMAL(38,18) NOT NULL,
    "return" DECIMAL(10,4) NOT NULL,
    "remainingTokens" DECIMAL(38,18) NOT NULL,
    "simulationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimulationResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Portfolio_userId_idx" ON "public"."Portfolio"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Token_symbol_key" ON "public"."Token"("symbol");

-- CreateIndex
CREATE INDEX "Token_symbol_idx" ON "public"."Token"("symbol");

-- CreateIndex
CREATE INDEX "Holding_portfolioId_idx" ON "public"."Holding"("portfolioId");

-- CreateIndex
CREATE INDEX "Holding_tokenId_idx" ON "public"."Holding"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "Holding_portfolioId_tokenId_key" ON "public"."Holding"("portfolioId", "tokenId");

-- CreateIndex
CREATE INDEX "StrategyTemplate_type_idx" ON "public"."StrategyTemplate"("type");

-- CreateIndex
CREATE INDEX "UserStrategy_userId_idx" ON "public"."UserStrategy"("userId");

-- CreateIndex
CREATE INDEX "UserStrategy_portfolioId_idx" ON "public"."UserStrategy"("portfolioId");

-- CreateIndex
CREATE INDEX "TokenStrategyConfiguration_userStrategyId_idx" ON "public"."TokenStrategyConfiguration"("userStrategyId");

-- CreateIndex
CREATE INDEX "TokenStrategyConfiguration_holdingId_idx" ON "public"."TokenStrategyConfiguration"("holdingId");

-- CreateIndex
CREATE UNIQUE INDEX "TokenStrategyConfiguration_userStrategyId_holdingId_key" ON "public"."TokenStrategyConfiguration"("userStrategyId", "holdingId");

-- CreateIndex
CREATE INDEX "SimulationResult_userStrategyId_idx" ON "public"."SimulationResult"("userStrategyId");

-- CreateIndex
CREATE INDEX "SimulationResult_tokenStrategyConfigId_idx" ON "public"."SimulationResult"("tokenStrategyConfigId");

-- AddForeignKey
ALTER TABLE "public"."Portfolio" ADD CONSTRAINT "Portfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Holding" ADD CONSTRAINT "Holding_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "public"."Portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Holding" ADD CONSTRAINT "Holding_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "public"."Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserStrategy" ADD CONSTRAINT "UserStrategy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserStrategy" ADD CONSTRAINT "UserStrategy_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "public"."Portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TokenStrategyConfiguration" ADD CONSTRAINT "TokenStrategyConfiguration_userStrategyId_fkey" FOREIGN KEY ("userStrategyId") REFERENCES "public"."UserStrategy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TokenStrategyConfiguration" ADD CONSTRAINT "TokenStrategyConfiguration_holdingId_fkey" FOREIGN KEY ("holdingId") REFERENCES "public"."Holding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TokenStrategyConfiguration" ADD CONSTRAINT "TokenStrategyConfiguration_strategyTemplateId_fkey" FOREIGN KEY ("strategyTemplateId") REFERENCES "public"."StrategyTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TokenStrategyConfiguration" ADD CONSTRAINT "TokenStrategyConfiguration_profitTakingTemplateId_fkey" FOREIGN KEY ("profitTakingTemplateId") REFERENCES "public"."ProfitTakingTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SimulationResult" ADD CONSTRAINT "SimulationResult_userStrategyId_fkey" FOREIGN KEY ("userStrategyId") REFERENCES "public"."UserStrategy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SimulationResult" ADD CONSTRAINT "SimulationResult_tokenStrategyConfigId_fkey" FOREIGN KEY ("tokenStrategyConfigId") REFERENCES "public"."TokenStrategyConfiguration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
