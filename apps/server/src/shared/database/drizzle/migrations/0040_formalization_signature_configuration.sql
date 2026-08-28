CREATE TYPE "public"."formalization_signatory_role" AS ENUM('client', 'responsible_lawyer', 'additional_collaborator');--> statement-breakpoint
CREATE TYPE "public"."formalization_signature_preview_state" AS ENUM('pending', 'processing', 'ready', 'failed', 'stale', 'cleanup_pending');--> statement-breakpoint
CREATE TYPE "public"."formalization_signature_field_type" AS ENUM('signature');--> statement-breakpoint
CREATE TABLE "stored_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_path" text NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"size_in_bytes" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stored_files_positive_size_ck" CHECK ("stored_files"."size_in_bytes" > 0)
);
--> statement-breakpoint
CREATE TABLE "formalization_signatories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"formalization_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"role" "formalization_signatory_role" NOT NULL,
	"position" integer NOT NULL,
	"selected_channel" "communication_channel",
	"created_by_collaborator_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_collaborator_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "formalization_signatories_owner_id_uq" UNIQUE("formalization_id","id"),
	CONSTRAINT "formalization_signatories_positive_position_ck" CHECK ("formalization_signatories"."position" >= 1)
);
--> statement-breakpoint
CREATE TABLE "formalization_signatory_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"formalization_id" uuid NOT NULL,
	"signatory_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"document_version_id" uuid NOT NULL,
	"created_by_collaborator_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "formalization_signature_previews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"formalization_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"document_version_id" uuid NOT NULL,
	"file_id" uuid,
	"content_checksum_sha256" varchar(64),
	"pdf_checksum_sha256" varchar(64),
	"converter_version" varchar(64),
	"page_count" integer,
	"pages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"byte_size" bigint,
	"state" "formalization_signature_preview_state" DEFAULT 'pending' NOT NULL,
	"attempts_count" integer DEFAULT 0 NOT NULL,
	"attempt_token" uuid,
	"processing_started_at" timestamp with time zone,
	"lease_expires_at" timestamp with time zone,
	"failure_code" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "formalization_signature_previews_attempts_count_ck" CHECK ("formalization_signature_previews"."attempts_count" >= 0),
	CONSTRAINT "formalization_signature_previews_lifecycle_ck" CHECK ((
        ("formalization_signature_previews"."state" = 'pending' and "formalization_signature_previews"."attempt_token" is not null and "formalization_signature_previews"."file_id" is null and "formalization_signature_previews"."processing_started_at" is null and "formalization_signature_previews"."lease_expires_at" is null)
        or
        ("formalization_signature_previews"."state" = 'processing' and "formalization_signature_previews"."attempt_token" is not null and "formalization_signature_previews"."processing_started_at" is not null and "formalization_signature_previews"."lease_expires_at" is not null and "formalization_signature_previews"."file_id" is null)
        or
        ("formalization_signature_previews"."state" = 'failed' and "formalization_signature_previews"."failure_code" is not null and "formalization_signature_previews"."file_id" is null and "formalization_signature_previews"."processing_started_at" is null and "formalization_signature_previews"."lease_expires_at" is null)
        or
        ("formalization_signature_previews"."state" in ('ready', 'stale', 'cleanup_pending') and "formalization_signature_previews"."file_id" is not null and "formalization_signature_previews"."content_checksum_sha256" is not null and "formalization_signature_previews"."pdf_checksum_sha256" is not null and "formalization_signature_previews"."converter_version" is not null and "formalization_signature_previews"."page_count" is not null and "formalization_signature_previews"."page_count" >= 1 and "formalization_signature_previews"."byte_size" is not null and "formalization_signature_previews"."byte_size" > 0 and "formalization_signature_previews"."attempt_token" is null and "formalization_signature_previews"."processing_started_at" is null and "formalization_signature_previews"."lease_expires_at" is null)
      ))
);
--> statement-breakpoint
CREATE TABLE "formalization_signature_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"formalization_id" uuid NOT NULL,
	"signatory_document_id" uuid NOT NULL,
	"preview_id" uuid NOT NULL,
	"type" "formalization_signature_field_type" DEFAULT 'signature' NOT NULL,
	"page" integer NOT NULL,
	"position_x" numeric(7, 4) NOT NULL,
	"position_y" numeric(7, 4) NOT NULL,
	"width" numeric(7, 4) NOT NULL,
	"height" numeric(7, 4) NOT NULL,
	"created_by_collaborator_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_collaborator_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "formalization_signature_fields_geometry_ck" CHECK ("formalization_signature_fields"."page" >= 1 and "formalization_signature_fields"."position_x" >= 0 and "formalization_signature_fields"."position_y" >= 0 and "formalization_signature_fields"."width" > 0 and "formalization_signature_fields"."height" > 0 and "formalization_signature_fields"."position_x" + "formalization_signature_fields"."width" <= 100 and "formalization_signature_fields"."position_y" + "formalization_signature_fields"."height" <= 100)
);
--> statement-breakpoint
ALTER TABLE "formalization_signatories" ADD CONSTRAINT "formalization_signatories_formalization_id_formalizations_id_fk" FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signatory_documents" ADD CONSTRAINT "formalization_signatory_documents_formalization_id_formalizations_id_fk" FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signatory_documents" ADD CONSTRAINT "formalization_signatory_documents_signatory_id_formalization_signatories_id_fk" FOREIGN KEY ("signatory_id") REFERENCES "public"."formalization_signatories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signatory_documents" ADD CONSTRAINT "formalization_signatory_documents_owner_signatory_fk" FOREIGN KEY ("formalization_id","signatory_id") REFERENCES "public"."formalization_signatories"("formalization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_previews" ADD CONSTRAINT "formalization_signature_previews_formalization_id_formalizations_id_fk" FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_previews" ADD CONSTRAINT "formalization_signature_previews_file_id_stored_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."stored_files"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_fields" ADD CONSTRAINT "formalization_signature_fields_formalization_id_formalizations_id_fk" FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_fields" ADD CONSTRAINT "formalization_signature_fields_signatory_document_id_formalization_signatory_documents_id_fk" FOREIGN KEY ("signatory_document_id") REFERENCES "public"."formalization_signatory_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_fields" ADD CONSTRAINT "formalization_signature_fields_preview_id_formalization_signature_previews_id_fk" FOREIGN KEY ("preview_id") REFERENCES "public"."formalization_signature_previews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "stored_files_file_path_uq" ON "stored_files" USING btree ("file_path");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signatories_owner_position_uq" ON "formalization_signatories" USING btree ("formalization_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signatories_owner_person_uq" ON "formalization_signatories" USING btree ("formalization_id","person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signatories_default_client_uq" ON "formalization_signatories" USING btree ("formalization_id") WHERE "formalization_signatories"."role" = 'client';--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signatories_default_lawyer_uq" ON "formalization_signatories" USING btree ("formalization_id") WHERE "formalization_signatories"."role" = 'responsible_lawyer';--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signatory_documents_pair_uq" ON "formalization_signatory_documents" USING btree ("signatory_id","document_id");--> statement-breakpoint
CREATE INDEX "formalization_signatory_documents_owner_document_idx" ON "formalization_signatory_documents" USING btree ("formalization_id","document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_previews_current_key_uq" ON "formalization_signature_previews" USING btree ("formalization_id","document_id","document_version_id") WHERE "formalization_signature_previews"."state" in ('pending', 'processing', 'ready', 'failed');--> statement-breakpoint
CREATE INDEX "formalization_signature_previews_work_idx" ON "formalization_signature_previews" USING btree ("state","lease_expires_at");--> statement-breakpoint
CREATE INDEX "formalization_signature_previews_cleanup_idx" ON "formalization_signature_previews" USING btree ("state","updated_at");--> statement-breakpoint
CREATE INDEX "formalization_signature_fields_assignment_idx" ON "formalization_signature_fields" USING btree ("signatory_document_id","preview_id");