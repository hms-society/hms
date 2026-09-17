-- The local migration ledger can report document-storage migrations as applied
-- even when their tables are absent. Restore the tables required by the seed
-- and document-production repositories without rewriting historical entries.
CREATE TABLE IF NOT EXISTS "stored_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_path" text NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"size_in_bytes" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stored_files_positive_size_ck" CHECK ("stored_files"."size_in_bytes" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "stored_files_file_path_uq"
	ON "stored_files" USING btree ("file_path");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "frozen_document_pdfs" (
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
	CONSTRAINT "frozen_document_pdfs_hashes_ck" CHECK ("frozen_document_pdfs"."source_sha256" ~ '^[a-f0-9]{64}$' AND "frozen_document_pdfs"."pdf_sha256" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "frozen_document_pdfs_dimensions_ck" CHECK ("frozen_document_pdfs"."document_version_number" >= 1 AND "frozen_document_pdfs"."page_count" >= 1 AND jsonb_array_length("frozen_document_pdfs"."pages") = "frozen_document_pdfs"."page_count" AND "frozen_document_pdfs"."byte_size" > 0)
);
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'frozen_document_pdfs_document_fk'
      AND conrelid = 'frozen_document_pdfs'::regclass
  ) THEN
    ALTER TABLE "frozen_document_pdfs"
      ADD CONSTRAINT "frozen_document_pdfs_document_fk"
      FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id")
      ON DELETE restrict ON UPDATE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'frozen_document_pdfs_version_fk'
      AND conrelid = 'frozen_document_pdfs'::regclass
  ) THEN
    ALTER TABLE "frozen_document_pdfs"
      ADD CONSTRAINT "frozen_document_pdfs_version_fk"
      FOREIGN KEY ("document_version_id") REFERENCES "public"."document_versions"("id")
      ON DELETE restrict ON UPDATE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'frozen_document_pdfs_specification_fk'
      AND conrelid = 'frozen_document_pdfs'::regclass
  ) THEN
    ALTER TABLE "frozen_document_pdfs"
      ADD CONSTRAINT "frozen_document_pdfs_specification_fk"
      FOREIGN KEY ("document_specification_id") REFERENCES "public"."document_specifications"("id")
      ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "frozen_document_pdfs_document_version_uq"
	ON "frozen_document_pdfs" USING btree ("document_version_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "frozen_document_pdfs_document_idx"
	ON "frozen_document_pdfs" USING btree ("document_id", "frozen_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "frozen_document_pdfs_specification_idx"
	ON "frozen_document_pdfs" USING btree ("document_specification_id");
