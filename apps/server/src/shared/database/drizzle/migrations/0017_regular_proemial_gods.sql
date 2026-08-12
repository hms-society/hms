CREATE TABLE "document_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"document_generation_id" uuid,
	"file_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"source" text NOT NULL,
	"content" jsonb NOT NULL,
	"pending_markers" jsonb NOT NULL,
	"created_by_collaborator_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "document_versions_number_check" CHECK ("document_versions"."version_number" > 0),
	CONSTRAINT "document_versions_source_check" CHECK ("document_versions"."source" in ('ai', 'manual')),
	CONSTRAINT "document_versions_content_check" CHECK (jsonb_typeof("document_versions"."content") = 'object' AND "document_versions"."content"->>'type' = 'doc'),
	CONSTRAINT "document_versions_pending_markers_check" CHECK (jsonb_typeof("document_versions"."pending_markers") = 'array')
);
--> statement-breakpoint
CREATE UNIQUE INDEX "document_versions_document_number_uq" ON "document_versions" USING btree ("document_id","version_number");--> statement-breakpoint
CREATE UNIQUE INDEX "document_versions_generation_uq" ON "document_versions" USING btree ("document_generation_id");--> statement-breakpoint
CREATE INDEX "document_versions_document_id_idx" ON "document_versions" USING btree ("document_id");