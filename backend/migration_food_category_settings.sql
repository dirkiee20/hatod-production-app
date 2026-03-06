-- Global food category configuration for customer-app category strip.
-- This keeps categories and images persistent even if no merchants currently match them.
CREATE TABLE IF NOT EXISTS "food_category_settings" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "food_category_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "food_category_settings_name_key"
  ON "food_category_settings"("name");

CREATE INDEX IF NOT EXISTS "food_category_settings_isActive_sortOrder_idx"
  ON "food_category_settings"("isActive", "sortOrder");
