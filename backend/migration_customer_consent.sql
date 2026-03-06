-- Customer consent metadata for policy/compliance auditability.
ALTER TABLE "customers"
ADD COLUMN IF NOT EXISTS "termsOfServiceVersion" TEXT,
ADD COLUMN IF NOT EXISTS "privacyPolicyVersion" TEXT,
ADD COLUMN IF NOT EXISTS "consentAcceptedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "consentAppVersion" TEXT;
