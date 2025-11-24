-- CreateTable
CREATE TABLE "public"."Forecast" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "appliedStrategies" JSONB NOT NULL,
    "summary" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Forecast_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Forecast_userId_idx" ON "public"."Forecast"("userId");

-- CreateIndex
CREATE INDEX "Forecast_portfolioId_idx" ON "public"."Forecast"("portfolioId");

-- AddForeignKey
ALTER TABLE "public"."Forecast" ADD CONSTRAINT "Forecast_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
