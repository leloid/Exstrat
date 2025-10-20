-- CreateTable
CREATE TABLE "public"."TheoreticalStrategy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tokenSymbol" TEXT NOT NULL,
    "tokenName" TEXT NOT NULL,
    "quantity" DECIMAL(38,18) NOT NULL,
    "averagePrice" DECIMAL(38,18) NOT NULL,
    "profitTargets" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TheoreticalStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TheoreticalStrategy_userId_idx" ON "public"."TheoreticalStrategy"("userId");

-- CreateIndex
CREATE INDEX "TheoreticalStrategy_tokenSymbol_idx" ON "public"."TheoreticalStrategy"("tokenSymbol");

-- AddForeignKey
ALTER TABLE "public"."TheoreticalStrategy" ADD CONSTRAINT "TheoreticalStrategy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
