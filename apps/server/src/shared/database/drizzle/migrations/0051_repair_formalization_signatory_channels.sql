-- Older repair runs can restore formalization_signatories with the legacy
-- selected_channel column even though the current model reads selected_channels.
ALTER TABLE "formalization_signatories"
  ADD COLUMN IF NOT EXISTS "selected_channels" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'formalization_signatories'
      AND column_name = 'selected_channel'
  ) THEN
    UPDATE "formalization_signatories"
    SET "selected_channels" = jsonb_build_array("selected_channel")
    WHERE "selected_channel" IS NOT NULL
      AND "selected_channels" = '[]'::jsonb;

    ALTER TABLE "formalization_signatories"
      DROP COLUMN "selected_channel";
  END IF;
END $$;
