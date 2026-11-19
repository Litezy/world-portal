-- PaymentTransaction.notes: staff notes captured when a bank transfer is
-- confirmed (ADR 0016). Nullable, so existing rows are untouched.
-- IF NOT EXISTS: databases built with `prisma db push` may already have it.
ALTER TABLE "PaymentTransaction" ADD COLUMN IF NOT EXISTS "notes" TEXT;
