CREATE TABLE "frozen_document_pdfs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"document_version_id" uuid NOT NULL,
	"document_version_number" integer NOT NULL,
	"document_specification_id" uuid NOT NULL,
	"source_document_version_id" uuid,
	"source" text NOT NULL,
	"source_file_id" uuid NOT NULL,
	"pdf_file_id" uuid NOT NULL,
	"source_sha256" text NOT NULL,
	"pdf_sha256" text NOT NULL,
	"converter_version" text NOT NULL,
	"page_count" integer NOT NULL,
	"pages" jsonb NOT NULL,
	"byte_size" integer NOT NULL,
	"approved_by_collaborator_id" uuid NOT NULL,
	"approved_at" timestamp with time zone NOT NULL,
	"frozen_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "frozen_document_pdfs_version_uq" ON "frozen_document_pdfs" USING btree ("document_version_id");--> statement-breakpoint
CREATE INDEX "frozen_document_pdfs_document_id_idx" ON "frozen_document_pdfs" USING btree ("document_id");