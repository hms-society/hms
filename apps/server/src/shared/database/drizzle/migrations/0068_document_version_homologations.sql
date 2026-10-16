CREATE TABLE "document_version_homologations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"document_version_id" uuid NOT NULL,
	"approved_by_collaborator_id" uuid NOT NULL,
	"approved_by_collaborator_name" text NOT NULL,
	"approved_by_collaborator_profile" text NOT NULL,
	"approved_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "document_version_homologations_version_uq" ON "document_version_homologations" USING btree ("document_version_id");--> statement-breakpoint
CREATE INDEX "document_version_homologations_case_id_idx" ON "document_version_homologations" USING btree ("case_id");