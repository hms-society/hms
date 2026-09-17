-- The local migration ledger contains an older 0043 entry that did not create this column.
-- Keep this repair idempotent so clean databases and existing environments both succeed.
ALTER TABLE "intakes" ADD COLUMN IF NOT EXISTS "contracted_at" timestamp with time zone;
