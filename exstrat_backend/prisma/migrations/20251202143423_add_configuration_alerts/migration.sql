-- CreateTable
CREATE TABLE "public"."AlertConfiguration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "forecastId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notificationChannels" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TokenAlert" (
    "id" TEXT NOT NULL,
    "alertConfigurationId" TEXT NOT NULL,
    "holdingId" TEXT NOT NULL,
    "tokenSymbol" TEXT NOT NULL,
    "strategyId" TEXT,
    "numberOfTargets" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TPAlert" (
    "id" TEXT NOT NULL,
    "tokenAlertId" TEXT NOT NULL,
    "tpOrder" INTEGER NOT NULL,
    "targetPrice" DECIMAL(38,18) NOT NULL,
    "sellQuantity" DECIMAL(38,18) NOT NULL,
    "projectedAmount" DECIMAL(38,18) NOT NULL,
    "remainingValue" DECIMAL(38,18) NOT NULL,
    "beforeTPEnabled" BOOLEAN NOT NULL DEFAULT true,
    "beforeTPValue" DECIMAL(10,4),
    "beforeTPType" TEXT NOT NULL DEFAULT 'percentage',
    "tpReachedEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TPAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AlertConfiguration_forecastId_key" ON "public"."AlertConfiguration"("forecastId");

-- CreateIndex
CREATE INDEX "AlertConfiguration_userId_idx" ON "public"."AlertConfiguration"("userId");

-- CreateIndex
CREATE INDEX "AlertConfiguration_forecastId_idx" ON "public"."AlertConfiguration"("forecastId");

-- CreateIndex
CREATE INDEX "TokenAlert_alertConfigurationId_idx" ON "public"."TokenAlert"("alertConfigurationId");

-- CreateIndex
CREATE INDEX "TokenAlert_holdingId_idx" ON "public"."TokenAlert"("holdingId");

-- CreateIndex
CREATE UNIQUE INDEX "TokenAlert_alertConfigurationId_holdingId_key" ON "public"."TokenAlert"("alertConfigurationId", "holdingId");

-- CreateIndex
CREATE INDEX "TPAlert_tokenAlertId_idx" ON "public"."TPAlert"("tokenAlertId");

-- CreateIndex
CREATE UNIQUE INDEX "TPAlert_tokenAlertId_tpOrder_key" ON "public"."TPAlert"("tokenAlertId", "tpOrder");

-- AddForeignKey
ALTER TABLE "public"."AlertConfiguration" ADD CONSTRAINT "AlertConfiguration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AlertConfiguration" ADD CONSTRAINT "AlertConfiguration_forecastId_fkey" FOREIGN KEY ("forecastId") REFERENCES "public"."Forecast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TokenAlert" ADD CONSTRAINT "TokenAlert_alertConfigurationId_fkey" FOREIGN KEY ("alertConfigurationId") REFERENCES "public"."AlertConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TPAlert" ADD CONSTRAINT "TPAlert_tokenAlertId_fkey" FOREIGN KEY ("tokenAlertId") REFERENCES "public"."TokenAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;
