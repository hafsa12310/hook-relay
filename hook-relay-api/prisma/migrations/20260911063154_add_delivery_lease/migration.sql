-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "processingExpiresAt" TIMESTAMP(3),
ADD COLUMN     "processingToken" TEXT;

-- CreateIndex
CREATE INDEX "Delivery_status_processingExpiresAt_idx" ON "Delivery"("status", "processingExpiresAt");
