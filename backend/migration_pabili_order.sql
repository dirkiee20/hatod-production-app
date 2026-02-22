-- Migration to link Pabili Requests into standard Orders pipeline

-- 1. Add pabiliRequestId column to the orders table
ALTER TABLE "orders" ADD COLUMN "pabiliRequestId" TEXT;

-- 2. Add Unique constraint
ALTER TABLE "orders" ADD CONSTRAINT "orders_pabiliRequestId_key" UNIQUE ("pabiliRequestId");

-- 3. Add Foreign Key linking to the pabili_requests table
ALTER TABLE "orders" ADD CONSTRAINT "orders_pabiliRequestId_fkey" FOREIGN KEY ("pabiliRequestId") REFERENCES "pabili_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
