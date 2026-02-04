-- Migration: Migrate alerts from Forecast-based to Strategy-based
-- This migration:
-- 1. Creates new StrategyAlert and StepAlert tables
-- 2. Migrates data from AlertConfiguration/TokenAlert/TPAlert to new structure (if needed)
-- 3. Drops old AlertConfiguration, TokenAlert, and TPAlert tables

-- Step 1: Create StrategyAlert table
CREATE TABLE "public"."StrategyAlert" (
    "id" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notificationChannels" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategyAlert_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create StepAlert table
CREATE TABLE "public"."StepAlert" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "beforeTPEnabled" BOOLEAN NOT NULL DEFAULT true,
    "tpReachedEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StepAlert_pkey" PRIMARY KEY ("id")
);

-- Step 3: Create unique constraints and indexes
CREATE UNIQUE INDEX "StrategyAlert_strategyId_key" ON "public"."StrategyAlert"("strategyId");
CREATE UNIQUE INDEX "StepAlert_stepId_key" ON "public"."StepAlert"("stepId");

CREATE INDEX "StrategyAlert_userId_idx" ON "public"."StrategyAlert"("userId");
CREATE INDEX "StrategyAlert_strategyId_idx" ON "public"."StrategyAlert"("strategyId");
CREATE INDEX "StepAlert_stepId_idx" ON "public"."StepAlert"("stepId");
CREATE INDEX "StepAlert_strategyId_idx" ON "public"."StepAlert"("strategyId");

-- Step 4: Add foreign key constraints
ALTER TABLE "public"."StrategyAlert" ADD CONSTRAINT "StrategyAlert_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "public"."Strategy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."StrategyAlert" ADD CONSTRAINT "StrategyAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."StepAlert" ADD CONSTRAINT "StepAlert_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "public"."StrategyStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 5: Remove alertConfigurationId column from Forecast if it exists
ALTER TABLE "public"."Forecast" DROP COLUMN IF EXISTS "alertConfigurationId";

-- Step 6: Drop old alert tables (data will be lost, but alerts are now strategy-based)
DROP TABLE IF EXISTS "public"."TPAlert";
DROP TABLE IF EXISTS "public"."TokenAlert";
DROP TABLE IF EXISTS "public"."AlertConfiguration";

