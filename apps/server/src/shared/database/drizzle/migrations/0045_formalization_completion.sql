CREATE TABLE "frozen_document_pdfs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"document_id" uuid NOT NULL,
	"document_version_id" uuid NOT NULL,
	"document_version_number" integer NOT NULL,
	"document_specification_id" uuid NOT NULL,
	"source_document_version_id" uuid,
	"source" varchar(16) NOT NULL,
	"source_file_id" uuid NOT NULL,
	"pdf_file_id" uuid NOT NULL,
	"source_sha256" varchar(64) NOT NULL,
	"pdf_sha256" varchar(64) NOT NULL,
	"converter_version" varchar(64) NOT NULL,
	"page_count" integer NOT NULL,
	"pages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"byte_size" bigint NOT NULL,
	"approved_by_collaborator_id" uuid NOT NULL,
	"approved_at" timestamp with time zone NOT NULL,
	"frozen_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "frozen_document_pdfs_hashes_ck" CHECK ("frozen_document_pdfs"."source_sha256" ~ '^[a-f0-9]{64}$' and "frozen_document_pdfs"."pdf_sha256" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "frozen_document_pdfs_dimensions_ck" CHECK ("frozen_document_pdfs"."document_version_number" >= 1 and "frozen_document_pdfs"."page_count" >= 1 and jsonb_array_length("frozen_document_pdfs"."pages") = "frozen_document_pdfs"."page_count" and "frozen_document_pdfs"."byte_size" > 0)
);
--> statement-breakpoint
ALTER TABLE "intakes" ADD COLUMN "contracted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "formalizations" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "formalizations" ADD COLUMN "completed_by_collaborator_id" uuid;--> statement-breakpoint
ALTER TABLE "formalizations" ADD COLUMN "contracting_confirmation_key" uuid;--> statement-breakpoint
ALTER TABLE "formalization_signature_cancellation_attempts" ADD COLUMN "reason" varchar(500);--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "formalizations"
    WHERE "status" = 'completed'
      AND ("completed_at" IS NULL
        OR "completed_by_collaborator_id" IS NULL
        OR "contracting_confirmation_key" IS NULL)
  ) THEN
    RAISE EXCEPTION 'Cannot migrate completed Formalizations without authoritative completion metadata';
  END IF;
END $$;--> statement-breakpoint
UPDATE "intakes" AS intake
SET "contracted_at" = formalization."completed_at"
FROM "formalizations" AS formalization
WHERE intake."status" = 'contracted'
  AND intake."contracted_at" IS NULL
  AND formalization."intake_id" = intake."id"
  AND formalization."status" = 'completed'
  AND formalization."completed_at" IS NOT NULL
  AND formalization."completed_by_collaborator_id" IS NOT NULL
  AND formalization."contracting_confirmation_key" IS NOT NULL;--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "intakes"
    WHERE "status" = 'contracted'
      AND "contracted_at" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot migrate contracted Intakes without authoritative Formalization completion metadata';
  END IF;
END $$;--> statement-breakpoint
UPDATE "formalization_signature_cancellation_attempts"
SET "reason" = 'Motivo indisponível: solicitação anterior à obrigatoriedade.'
WHERE "reason" IS NULL;--> statement-breakpoint
ALTER TABLE "formalization_signature_cancellation_attempts" ALTER COLUMN "reason" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "frozen_document_pdfs" ADD CONSTRAINT "frozen_document_pdfs_document_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "frozen_document_pdfs" ADD CONSTRAINT "frozen_document_pdfs_version_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."document_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "frozen_document_pdfs" ADD CONSTRAINT "frozen_document_pdfs_specification_fk" FOREIGN KEY ("document_specification_id") REFERENCES "public"."document_specifications"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "frozen_document_pdfs_document_version_uq" ON "frozen_document_pdfs" USING btree ("document_version_id");--> statement-breakpoint
CREATE INDEX "frozen_document_pdfs_document_idx" ON "frozen_document_pdfs" USING btree ("document_id","frozen_at");--> statement-breakpoint
CREATE INDEX "frozen_document_pdfs_specification_idx" ON "frozen_document_pdfs" USING btree ("document_specification_id");--> statement-breakpoint
CREATE UNIQUE INDEX "formalizations_contracting_confirmation_key_uq" ON "formalizations" USING btree ("contracting_confirmation_key") WHERE "formalizations"."contracting_confirmation_key" is not null;--> statement-breakpoint
ALTER TABLE "intakes" ADD CONSTRAINT "intakes_contracted_state_check" CHECK ((
        ("intakes"."status" = 'contracted' and "intakes"."contracted_at" is not null)
        or
        ("intakes"."status" <> 'contracted' and "intakes"."contracted_at" is null)
      ));--> statement-breakpoint
ALTER TABLE "intakes" ADD CONSTRAINT "intakes_terminal_state_exclusivity_check" CHECK ("intakes"."status" <> 'contracted' or ("intakes"."closure_reason" is null and "intakes"."closure_notes" is null and "intakes"."closed_at" is null));--> statement-breakpoint
ALTER TABLE "formalizations" ADD CONSTRAINT "formalizations_completion_check" CHECK ((
        ("formalizations"."status" = 'completed' and "formalizations"."completed_at" is not null and "formalizations"."completed_by_collaborator_id" is not null and "formalizations"."contracting_confirmation_key" is not null)
        or
        ("formalizations"."status" <> 'completed' and "formalizations"."completed_at" is null and "formalizations"."completed_by_collaborator_id" is null and "formalizations"."contracting_confirmation_key" is null)
      ));--> statement-breakpoint
ALTER TABLE "formalization_signature_cancellation_attempts" ADD CONSTRAINT "formalization_signature_cancellation_attempts_reason_ck" CHECK (char_length(btrim("formalization_signature_cancellation_attempts"."reason")) between 1 and 500);
