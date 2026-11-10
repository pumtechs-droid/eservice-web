-- AlterTable
ALTER TABLE "ServiceQuotation" ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "sentById" TEXT,
ADD COLUMN     "sentByName" TEXT;

-- CreateIndex
CREATE INDEX "ServiceQuotation_sentAt_idx" ON "ServiceQuotation"("sentAt");

-- CreateIndex
CREATE INDEX "ServiceQuotation_sentById_idx" ON "ServiceQuotation"("sentById");
