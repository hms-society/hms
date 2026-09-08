ALTER TABLE "formalization_signatories" ADD COLUMN "selected_channels" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
UPDATE "formalization_signatories"
SET "selected_channels" = jsonb_build_array("selected_channel")
WHERE "selected_channel" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "formalization_signatories" DROP COLUMN "selected_channel";
