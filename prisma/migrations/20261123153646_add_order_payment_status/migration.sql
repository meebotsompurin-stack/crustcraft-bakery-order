-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID';

-- CreateIndex
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");
