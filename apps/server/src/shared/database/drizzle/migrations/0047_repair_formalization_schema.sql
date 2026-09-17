-- The local migration ledger can report the formalization migrations as applied
-- even when the corresponding tables are absent. Recreate the aggregate needed
-- by the formalization and dynamic-form usage boundaries without rewriting the
-- historical migration entries.
DO $$
BEGIN
  CREATE TYPE "formalization_signature_request_status" AS ENUM(
    'provisioning',
    'sending',
    'sent',
    'in_progress',
    'partially_submitted',
    'submitted',
    'reconciliation_required',
    'confirmed',
    'rejected',
    'cancelled',
    'expired',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "formalizations" (
  "id" uuid PRIMARY KEY NOT NULL,
  "intake_id" uuid NOT NULL,
  "client_id" uuid NOT NULL,
  "consultation_id" uuid NOT NULL,
  "assigned_lawyer_id" uuid NOT NULL,
  "legal_area_id" uuid,
  "legal_topic_id" uuid,
  "status" text DEFAULT 'in_progress' NOT NULL,
  "contract_form_id" uuid NOT NULL,
  "contract_form_snapshot" jsonb NOT NULL,
  "contract_form_answers" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "contract_form_state" text DEFAULT 'open' NOT NULL,
  "contract_form_revision" integer DEFAULT 0 NOT NULL,
  "contract_form_closed_at" timestamp with time zone,
  "contract_form_closed_by_collaborator_id" uuid,
  "documents_confirmed_at" timestamp with time zone,
  "documents_confirmed_by_collaborator_id" uuid,
  "documents_confirmed_revision" integer,
  "signature_request_id" uuid,
  "signature_status" "formalization_signature_request_status",
  "signature_submitted_at" timestamp with time zone,
  "signature_confirmed_at" timestamp with time zone,
  "signature_terminal_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "completed_by_collaborator_id" uuid,
  "contracting_confirmation_key" uuid,
  "cancelled_at" timestamp with time zone,
  "cancelled_by_collaborator_id" uuid,
  "version" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

ALTER TABLE "formalizations" ADD COLUMN IF NOT EXISTS "legal_area_id" uuid;
--> statement-breakpoint
ALTER TABLE "formalizations" ADD COLUMN IF NOT EXISTS "legal_topic_id" uuid;
--> statement-breakpoint
ALTER TABLE "formalizations" ADD COLUMN IF NOT EXISTS "signature_request_id" uuid;
--> statement-breakpoint
ALTER TABLE "formalizations"
  ADD COLUMN IF NOT EXISTS "signature_status" "formalization_signature_request_status";
--> statement-breakpoint
ALTER TABLE "formalizations"
  ADD COLUMN IF NOT EXISTS "signature_submitted_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "formalizations"
  ADD COLUMN IF NOT EXISTS "signature_confirmed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "formalizations"
  ADD COLUMN IF NOT EXISTS "signature_terminal_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "formalizations" ADD COLUMN IF NOT EXISTS "completed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "formalizations"
  ADD COLUMN IF NOT EXISTS "completed_by_collaborator_id" uuid;
--> statement-breakpoint
ALTER TABLE "formalizations"
  ADD COLUMN IF NOT EXISTS "contracting_confirmation_key" uuid;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'formalizations_status_check'
      AND conrelid = 'formalizations'::regclass
  ) THEN
    ALTER TABLE "formalizations"
      ADD CONSTRAINT "formalizations_status_check"
      CHECK ("status" in ('in_progress', 'completed', 'cancelled'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'formalizations_form_state_check'
      AND conrelid = 'formalizations'::regclass
  ) THEN
    ALTER TABLE "formalizations"
      ADD CONSTRAINT "formalizations_form_state_check"
      CHECK ("contract_form_state" in ('open', 'closed'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'formalizations_revision_check'
      AND conrelid = 'formalizations'::regclass
  ) THEN
    ALTER TABLE "formalizations"
      ADD CONSTRAINT "formalizations_revision_check"
      CHECK ("contract_form_revision" >= 0 AND "version" >= 1);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'formalizations_confirmation_check'
      AND conrelid = 'formalizations'::regclass
  ) THEN
    ALTER TABLE "formalizations"
      ADD CONSTRAINT "formalizations_confirmation_check"
      CHECK (
        ("documents_confirmed_at" IS NULL
          AND "documents_confirmed_by_collaborator_id" IS NULL
          AND "documents_confirmed_revision" IS NULL)
        OR
        ("documents_confirmed_at" IS NOT NULL
          AND "documents_confirmed_by_collaborator_id" IS NOT NULL
          AND "documents_confirmed_revision" IS NOT NULL)
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'formalizations_cancellation_check'
      AND conrelid = 'formalizations'::regclass
  ) THEN
    ALTER TABLE "formalizations"
      ADD CONSTRAINT "formalizations_cancellation_check"
      CHECK (
        ("status" = 'cancelled'
          AND "cancelled_at" IS NOT NULL
          AND "cancelled_by_collaborator_id" IS NOT NULL)
        OR
        ("status" <> 'cancelled'
          AND "cancelled_at" IS NULL
          AND "cancelled_by_collaborator_id" IS NULL)
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'formalizations_completion_check'
      AND conrelid = 'formalizations'::regclass
  ) THEN
    ALTER TABLE "formalizations"
      ADD CONSTRAINT "formalizations_completion_check"
      CHECK (
        ("status" = 'completed'
          AND "completed_at" IS NOT NULL
          AND "completed_by_collaborator_id" IS NOT NULL
          AND "contracting_confirmation_key" IS NOT NULL)
        OR
        ("status" <> 'completed'
          AND "completed_at" IS NULL
          AND "completed_by_collaborator_id" IS NULL
          AND "contracting_confirmation_key" IS NULL)
      );
  END IF;
END $$;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "formalizations_intake_uq"
  ON "formalizations" USING btree ("intake_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalizations_assigned_lawyer_idx"
  ON "formalizations" USING btree ("assigned_lawyer_id", "status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalizations_contracting_confirmation_key_uq"
  ON "formalizations" USING btree ("contracting_confirmation_key")
  WHERE "formalizations"."contracting_confirmation_key" IS NOT NULL;
