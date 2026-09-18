-- The local migration ledger reports case-management migrations as applied,
-- but the live cases table predates the versioned model.
ALTER TABLE "cases"
  ADD COLUMN IF NOT EXISTS "version" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cases_version_positive_check'
      AND conrelid = 'cases'::regclass
  ) THEN
    ALTER TABLE "cases"
      ADD CONSTRAINT "cases_version_positive_check"
      CHECK ("version" > 0);
  END IF;
END $$;
