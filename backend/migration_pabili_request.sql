-- CreateEnum
CREATE TYPE "PabiliRequestStatus" AS ENUM ('PENDING_REVIEW', 'QUOTED', 'ACCEPTED', 'REJECTED', 'COMPLETED');

-- CreateTable
CREATE TABLE "pabili_requests" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "estimatedItemCost" DOUBLE PRECISION NOT NULL,
    "serviceFee" DOUBLE PRECISION,
    "status" "PabiliRequestStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pabili_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pabili_requests_customerId_idx" ON "pabili_requests"("customerId");

-- CreateIndex
CREATE INDEX "pabili_requests_status_idx" ON "pabili_requests"("status");

-- AddForeignKey
ALTER TABLE "pabili_requests" ADD CONSTRAINT "pabili_requests_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
