-- AlterTable
ALTER TABLE "public"."Transaction" ADD COLUMN     "portfolioId" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_portfolioId_idx" ON "public"."Transaction"("portfolioId");

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "public"."Portfolio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
