-- Restore the signature configuration and gateway tables from historical migrations
-- 0040 and 0042 when the local migration ledger is ahead of the database schema.
DO $$
BEGIN
  CREATE TYPE "public"."formalization_signatory_role" AS ENUM('client', 'responsible_lawyer', 'additional_collaborator');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE "public"."formalization_signature_preview_state" AS ENUM('pending', 'processing', 'ready', 'failed', 'stale', 'cleanup_pending');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE "public"."formalization_signature_field_type" AS ENUM('signature');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
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
CREATE TABLE IF NOT EXISTS "formalization_signatories" (
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
CREATE TABLE IF NOT EXISTS "formalization_signatory_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"formalization_id" uuid NOT NULL,
	"signatory_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"document_version_id" uuid NOT NULL,
	"created_by_collaborator_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "formalization_signature_previews" (
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
CREATE TABLE IF NOT EXISTS "formalization_signature_fields" (
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
-- Add repair constraints only when the clean migration chain has not already added them.
DO $repair_constraints$
DECLARE
  constraint_definition record;
BEGIN
  FOR constraint_definition IN
    SELECT *
    FROM (
      VALUES
        ('public.formalization_signatories'::regclass, 'formalization_signatories_formalization_id_formalizations_id_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signatory_documents'::regclass, 'formalization_signatory_documents_formalization_id_formalizations_id_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signatory_documents'::regclass, 'formalization_signatory_documents_signatory_id_formalization_signatories_id_fk', 'FOREIGN KEY ("signatory_id") REFERENCES "public"."formalization_signatories"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signatory_documents'::regclass, 'formalization_signatory_documents_owner_signatory_fk', 'FOREIGN KEY ("formalization_id","signatory_id") REFERENCES "public"."formalization_signatories"("formalization_id","id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_previews'::regclass, 'formalization_signature_previews_formalization_id_formalizations_id_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_previews'::regclass, 'formalization_signature_previews_file_id_stored_files_id_fk', 'FOREIGN KEY ("file_id") REFERENCES "public"."stored_files"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_fields'::regclass, 'formalization_signature_fields_formalization_id_formalizations_id_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_fields'::regclass, 'formalization_signature_fields_signatory_document_id_formalization_signatory_documents_id_fk', 'FOREIGN KEY ("signatory_document_id") REFERENCES "public"."formalization_signatory_documents"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_fields'::regclass, 'formalization_signature_fields_preview_id_formalization_signature_previews_id_fk', 'FOREIGN KEY ("preview_id") REFERENCES "public"."formalization_signature_previews"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_snapshots'::regclass, 'fs_snapshot_formalization_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_requests'::regclass, 'fs_req_formalization_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_requests'::regclass, 'fs_req_snapshot_fk', 'FOREIGN KEY ("snapshot_id") REFERENCES "public"."formalization_signature_snapshots"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_request_documents'::regclass, 'fs_req_doc_req_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_recipients'::regclass, 'fs_recipient_req_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_recipients'::regclass, 'fs_recipient_signatory_fk', 'FOREIGN KEY ("signatory_id") REFERENCES "public"."formalization_signatories"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_recipient_documents'::regclass, 'fs_sig_rec_doc_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_recipient_documents'::regclass, 'fs_sig_rec_doc_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_recipient_documents'::regclass, 'fs_sig_rec_doc_document_fk', 'FOREIGN KEY ("request_document_id") REFERENCES "public"."formalization_signature_request_documents"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_invitations'::regclass, 'fs_invitation_req_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_invitations'::regclass, 'fs_invitation_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_invitation_send_attempts'::regclass, 'fs_inv_send_inv_fk', 'FOREIGN KEY ("invitation_id") REFERENCES "public"."formalization_signature_invitations"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_provider_resources'::regclass, 'fs_sig_provider_resource_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_provider_recipient_resources'::regclass, 'fs_sig_prr_provider_resource_fk', 'FOREIGN KEY ("provider_resource_id") REFERENCES "public"."formalization_signature_provider_resources"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_provider_recipient_resources'::regclass, 'fs_sig_prr_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_provider_document_resources'::regclass, 'fs_sig_pdr_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_provider_document_resources'::regclass, 'fs_sig_pdr_resource_fk', 'FOREIGN KEY ("provider_resource_id") REFERENCES "public"."formalization_signature_provider_resources"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_provider_document_resources'::regclass, 'fs_sig_pdr_document_fk', 'FOREIGN KEY ("request_document_id") REFERENCES "public"."formalization_signature_request_documents"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_provisioning_attempts'::regclass, 'fs_sig_prov_attempt_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_cancellation_attempts'::regclass, 'fs_sig_cancel_attempt_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_otp_guards'::regclass, 'fs_otp_guard_inv_fk', 'FOREIGN KEY ("invitation_id") REFERENCES "public"."formalization_signature_invitations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_otp_challenges'::regclass, 'fs_otp_challenge_inv_fk', 'FOREIGN KEY ("invitation_id") REFERENCES "public"."formalization_signature_invitations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_otp_send_attempts'::regclass, 'fs_otp_send_challenge_fk', 'FOREIGN KEY ("challenge_id") REFERENCES "public"."formalization_signature_otp_challenges"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_otp_rate_reservations'::regclass, 'fs_otp_rate_inv_fk', 'FOREIGN KEY ("invitation_id") REFERENCES "public"."formalization_signature_invitations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_gateway_sessions'::regclass, 'fs_sig_gateway_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_gateway_sessions'::regclass, 'fs_sig_gateway_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_gateway_sessions'::regclass, 'fs_sig_gateway_snapshot_fk', 'FOREIGN KEY ("snapshot_id") REFERENCES "public"."formalization_signature_snapshots"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_document_acknowledgements'::regclass, 'fs_sig_ack_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_document_acknowledgements'::regclass, 'fs_sig_ack_document_fk', 'FOREIGN KEY ("request_document_id") REFERENCES "public"."formalization_signature_request_documents"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_document_acknowledgements'::regclass, 'fs_sig_ack_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_document_acknowledgements'::regclass, 'fs_sig_ack_snapshot_fk', 'FOREIGN KEY ("snapshot_id") REFERENCES "public"."formalization_signature_snapshots"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_document_acknowledgements'::regclass, 'fs_sig_ack_session_fk', 'FOREIGN KEY ("session_id") REFERENCES "public"."formalization_signature_gateway_sessions"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_proxy_bindings'::regclass, 'fs_sig_proxy_session_fk', 'FOREIGN KEY ("session_id") REFERENCES "public"."formalization_signature_gateway_sessions"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_proxy_bindings'::regclass, 'fs_sig_proxy_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_proxy_bindings'::regclass, 'fs_sig_proxy_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_artifacts'::regclass, 'fs_sig_artifact_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_artifacts'::regclass, 'fs_sig_artifact_req_doc_fk', 'FOREIGN KEY ("request_document_id") REFERENCES "public"."formalization_signature_request_documents"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_protocols'::regclass, 'fs_sig_protocol_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_protocols'::regclass, 'fs_sig_protocol_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_audit_entries'::regclass, 'fs_sig_audit_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE set null ON UPDATE no action'),
        ('public.formalization_signature_audit_entries'::regclass, 'fs_sig_audit_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE set null ON UPDATE no action'),
        ('public.formalization_signature_audit_entries'::regclass, 'fs_sig_audit_invitation_fk', 'FOREIGN KEY ("invitation_id") REFERENCES "public"."formalization_signature_invitations"("id") ON DELETE set null ON UPDATE no action'),
        ('public.formalization_signature_audit_entries'::regclass, 'fs_sig_audit_session_fk', 'FOREIGN KEY ("session_id") REFERENCES "public"."formalization_signature_gateway_sessions"("id") ON DELETE set null ON UPDATE no action'),
        ('public.formalization_signature_previews'::regclass, 'fs_sig_preview_formalization_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_previews'::regclass, 'fs_sig_preview_file_fk', 'FOREIGN KEY ("file_id") REFERENCES "public"."stored_files"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_fields'::regclass, 'fs_sig_field_formalization_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_fields'::regclass, 'fs_sig_field_signatory_doc_fk', 'FOREIGN KEY ("signatory_document_id") REFERENCES "public"."formalization_signatory_documents"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_fields'::regclass, 'fs_sig_field_preview_fk', 'FOREIGN KEY ("preview_id") REFERENCES "public"."formalization_signature_previews"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_cancellation_attempts'::regclass, 'formalization_signature_cancellation_attempts_reason_ck', 'CHECK (char_length(btrim("reason")) between 1 and 500)')
    ) AS definitions(table_name, constraint_name, definition)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conrelid = constraint_definition.table_name
        AND conname = left(constraint_definition.constraint_name, 63)
    ) THEN
      EXECUTE format(
        'ALTER TABLE %s ADD CONSTRAINT %I %s',
        constraint_definition.table_name,
        constraint_definition.constraint_name,
        constraint_definition.definition
      );
    END IF;
  END LOOP;
END $repair_constraints$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "stored_files_file_path_uq" ON "stored_files" USING btree ("file_path");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signatories_owner_position_uq" ON "formalization_signatories" USING btree ("formalization_id","position");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signatories_owner_person_uq" ON "formalization_signatories" USING btree ("formalization_id","person_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signatories_default_client_uq" ON "formalization_signatories" USING btree ("formalization_id") WHERE "formalization_signatories"."role" = 'client';
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signatories_default_lawyer_uq" ON "formalization_signatories" USING btree ("formalization_id") WHERE "formalization_signatories"."role" = 'responsible_lawyer';
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signatory_documents_pair_uq" ON "formalization_signatory_documents" USING btree ("signatory_id","document_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signatory_documents_owner_document_idx" ON "formalization_signatory_documents" USING btree ("formalization_id","document_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_previews_current_key_uq" ON "formalization_signature_previews" USING btree ("formalization_id","document_id","document_version_id") WHERE "formalization_signature_previews"."state" in ('pending', 'processing', 'ready', 'failed');
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_previews_work_idx" ON "formalization_signature_previews" USING btree ("state","lease_expires_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_previews_cleanup_idx" ON "formalization_signature_previews" USING btree ("state","updated_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_fields_assignment_idx" ON "formalization_signature_fields" USING btree ("signatory_document_id","preview_id");
--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE "public"."formalization_signature_request_status" AS ENUM('provisioning', 'sending', 'sent', 'in_progress', 'partially_submitted', 'submitted', 'reconciliation_required', 'confirmed', 'rejected', 'cancelled', 'expired', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE "public"."formalization_signature_request_document_status" AS ENUM('pending', 'processing', 'provisioned', 'delivery_pending', 'sent', 'submitted', 'reconciliation_required', 'confirmed', 'rejected', 'cancelled', 'expired', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE "public"."formalization_signature_recipient_kind" AS ENUM('client', 'collaborator');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE "public"."formalization_signature_recipient_status" AS ENUM('invited', 'authenticating', 'locked', 'authenticated', 'reading', 'signing', 'submitted', 'reconciliation_required', 'confirmed', 'rejected', 'cancelled', 'expired');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE "public"."formalization_signature_invitation_status" AS ENUM('active', 'consumed', 'revoked', 'expired');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE "public"."formalization_signature_delivery_status" AS ENUM('pending', 'delivered', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE "public"."formalization_signature_provider" AS ENUM('documenso');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE "public"."formalization_signature_provisioning_attempt_status" AS ENUM('pending', 'processing', 'provisioned', 'reconciliation_required', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE "public"."formalization_signature_cancellation_attempt_status" AS ENUM('pending', 'processing', 'cancelled', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE "public"."formalization_signature_otp_challenge_status" AS ENUM('pending_delivery', 'active', 'consumed', 'superseded', 'expired', 'delivery_failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE "public"."formalization_signature_session_kind" AS ENUM('flow', 'authenticated', 'result');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE "public"."formalization_signature_access_status" AS ENUM('active', 'revoked', 'expired');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE "public"."formalization_signature_artifact_kind" AS ENUM('signed_pdf', 'provider_certificate', 'provider_evidence');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE "public"."formalization_signature_webhook_status" AS ENUM('pending', 'processing', 'processed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "formalization_signature_snapshots" (
	"id" uuid PRIMARY KEY NOT NULL,
	"formalization_id" uuid NOT NULL,
	"formalization_version" integer NOT NULL,
	"signature_configuration_version" integer NOT NULL,
	"snapshot_hash" "bytea" NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "formalization_signature_snapshots_versions_ck" CHECK ("formalization_signature_snapshots"."formalization_version" > 0 and "formalization_signature_snapshots"."signature_configuration_version" > 0),
	CONSTRAINT "formalization_signature_snapshots_hash_ck" CHECK (octet_length("formalization_signature_snapshots"."snapshot_hash") = 32)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "formalization_signature_requests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"formalization_id" uuid NOT NULL,
	"signature_configuration_version" integer NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"confirmation_key_hash" "bytea" NOT NULL,
	"status" "formalization_signature_request_status" NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"terminal_at" timestamp with time zone,
	"cancellation_requested_at" timestamp with time zone,
	CONSTRAINT "fs_req_snapshot_uq" UNIQUE("snapshot_id"),
	CONSTRAINT "formalization_signature_requests_versions_ck" CHECK ("formalization_signature_requests"."signature_configuration_version" > 0 and "formalization_signature_requests"."version" > 0),
	CONSTRAINT "formalization_signature_requests_confirmation_key_ck" CHECK (octet_length("formalization_signature_requests"."confirmation_key_hash") = 32)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "formalization_signature_request_documents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	"source_document_id" uuid NOT NULL,
	"source_document_version_id" uuid NOT NULL,
	"signature_preview_id" uuid NOT NULL,
	"unsigned_private_file_id" uuid NOT NULL,
	"unsigned_sha256" "bytea" NOT NULL,
	"byte_count" bigint NOT NULL,
	"page_count" integer NOT NULL,
	"position" integer NOT NULL,
	"status" "formalization_signature_request_document_status" NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"provisioned_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"terminal_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "formalization_signature_request_documents_hash_ck" CHECK (octet_length("formalization_signature_request_documents"."unsigned_sha256") = 32),
	CONSTRAINT "formalization_signature_request_documents_values_ck" CHECK ("formalization_signature_request_documents"."byte_count" > 0 and "formalization_signature_request_documents"."page_count" > 0 and "formalization_signature_request_documents"."position" >= 0 and "formalization_signature_request_documents"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "formalization_signature_recipients" (
	"id" uuid PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	"signatory_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"actor_kind" "formalization_signature_recipient_kind" NOT NULL,
	"display_name_snapshot" varchar(255) NOT NULL,
	"delivery_channel" varchar(32) NOT NULL,
	"status" "formalization_signature_recipient_status" NOT NULL,
	"submission_observation_id" "bytea",
	"version" integer DEFAULT 1 NOT NULL,
	"invited_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"terminal_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "formalization_signature_recipients_channel_ck" CHECK ("formalization_signature_recipients"."delivery_channel" = 'email'),
	CONSTRAINT "formalization_signature_recipients_version_ck" CHECK ("formalization_signature_recipients"."version" > 0),
	CONSTRAINT "formalization_signature_recipients_submission_observation_ck" CHECK ("formalization_signature_recipients"."submission_observation_id" is null or octet_length("formalization_signature_recipients"."submission_observation_id") = 32)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "formalization_signature_recipient_documents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"request_document_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "formalization_signature_invitations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"generation" integer NOT NULL,
	"token_hash" "bytea" NOT NULL,
	"status" "formalization_signature_invitation_status" NOT NULL,
	"delivery_status" "formalization_signature_delivery_status" NOT NULL,
	"communication_message_id" varchar(255),
	"expires_at" timestamp with time zone NOT NULL,
	"delivered_at" timestamp with time zone,
	"consumed_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"revocation_reason" varchar(128),
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "formalization_signature_invitations_generation_ck" CHECK ("formalization_signature_invitations"."generation" > 0),
	CONSTRAINT "formalization_signature_invitations_token_hash_ck" CHECK (octet_length("formalization_signature_invitations"."token_hash") = 32)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "formalization_signature_invitation_send_attempts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"invitation_id" uuid NOT NULL,
	"encrypted_payload" "bytea" NOT NULL,
	"cipher_key_id" varchar(128) NOT NULL,
	"status" "formalization_signature_delivery_status" NOT NULL,
	"communication_message_id" varchar(255),
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "fs_inv_send_inv_uq" UNIQUE("invitation_id"),
	CONSTRAINT "formalization_signature_invitation_send_attempts_attempts_ck" CHECK ("formalization_signature_invitation_send_attempts"."attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "formalization_signature_provider_resources" (
	"id" uuid PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	"provider" "formalization_signature_provider" NOT NULL,
	"provider_contract_version" varchar(64) NOT NULL,
	"provider_envelope_id" varchar(255) NOT NULL,
	"provider_external_id" varchar(255) NOT NULL,
	"idempotency_key" varchar(255) NOT NULL,
	"last_reconciled_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "formalization_signature_provider_resources_ids_ck" CHECK ("formalization_signature_provider_resources"."provider_envelope_id" <> '' and "formalization_signature_provider_resources"."provider_external_id" <> '' and "formalization_signature_provider_resources"."idempotency_key" <> '')
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "formalization_signature_provider_recipient_resources" (
	"id" uuid PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	"provider_resource_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"provider_recipient_id" varchar(255) NOT NULL,
	"encrypted_signing_credential" "bytea" NOT NULL,
	"cipher_key_id" varchar(128) NOT NULL,
	"last_reconciled_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "formalization_signature_provider_recipient_resources_ids_ck" CHECK ("formalization_signature_provider_recipient_resources"."provider_recipient_id" <> '')
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "formalization_signature_provider_document_resources" (
	"id" uuid PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	"provider_resource_id" uuid NOT NULL,
	"request_document_id" uuid NOT NULL,
	"provider_envelope_item_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "formalization_signature_provisioning_attempts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	"attempt_token" uuid NOT NULL,
	"status" "formalization_signature_provisioning_attempt_status" NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"lease_expires_at" timestamp with time zone,
	"next_attempt_at" timestamp with time zone,
	"last_failure_code" varchar(128),
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "formalization_signature_provisioning_attempts_attempts_ck" CHECK ("formalization_signature_provisioning_attempts"."attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "formalization_signature_cancellation_attempts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	"attempt_token" uuid NOT NULL,
	"status" "formalization_signature_cancellation_attempt_status" NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"requested_by" uuid NOT NULL,
	"requested_at" timestamp with time zone NOT NULL,
	"lease_expires_at" timestamp with time zone,
	"next_attempt_at" timestamp with time zone,
	"last_failure_code" varchar(128),
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "formalization_signature_cancellation_attempts_attempts_ck" CHECK ("formalization_signature_cancellation_attempts"."attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "formalization_signature_otp_guards" (
	"invitation_id" uuid PRIMARY KEY NOT NULL,
	"failed_attempts" smallint DEFAULT 0 NOT NULL,
	"rolling_window_started_at" timestamp with time zone NOT NULL,
	"sends_in_window" smallint DEFAULT 0 NOT NULL,
	"last_sent_at" timestamp with time zone,
	"locked_until" timestamp with time zone,
	"updated_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "formalization_signature_otp_guards_failed_attempts_ck" CHECK ("formalization_signature_otp_guards"."failed_attempts" between 0 and 5),
	CONSTRAINT "formalization_signature_otp_guards_sends_ck" CHECK ("formalization_signature_otp_guards"."sends_in_window" >= 0),
	CONSTRAINT "formalization_signature_otp_guards_version_ck" CHECK ("formalization_signature_otp_guards"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "formalization_signature_otp_challenges" (
	"id" uuid PRIMARY KEY NOT NULL,
	"invitation_id" uuid NOT NULL,
	"generation" integer NOT NULL,
	"code_mac" "bytea" NOT NULL,
	"channel_choice_id" uuid NOT NULL,
	"destination_fingerprint" "bytea" NOT NULL,
	"status" "formalization_signature_otp_challenge_status" NOT NULL,
	"failed_attempts" smallint DEFAULT 0 NOT NULL,
	"issued_at" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"consumed_at" timestamp with time zone,
	CONSTRAINT "formalization_signature_otp_challenges_generation_ck" CHECK ("formalization_signature_otp_challenges"."generation" > 0),
	CONSTRAINT "formalization_signature_otp_challenges_code_mac_ck" CHECK (octet_length("formalization_signature_otp_challenges"."code_mac") = 32),
	CONSTRAINT "formalization_signature_otp_challenges_destination_ck" CHECK (octet_length("formalization_signature_otp_challenges"."destination_fingerprint") = 32),
	CONSTRAINT "formalization_signature_otp_challenges_failed_attempts_ck" CHECK ("formalization_signature_otp_challenges"."failed_attempts" between 0 and 5)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "formalization_signature_otp_send_attempts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"challenge_id" uuid NOT NULL,
	"encrypted_payload" "bytea" NOT NULL,
	"cipher_key_id" varchar(128) NOT NULL,
	"status" "formalization_signature_delivery_status" NOT NULL,
	"provider_message_id" varchar(255),
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "fs_otp_send_challenge_uq" UNIQUE("challenge_id"),
	CONSTRAINT "formalization_signature_otp_send_attempts_attempts_ck" CHECK ("formalization_signature_otp_send_attempts"."attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "formalization_signature_otp_rate_reservations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"invitation_id" uuid NOT NULL,
	"source_ip_hash" "bytea" NOT NULL,
	"reserved_at" timestamp with time zone NOT NULL,
	CONSTRAINT "formalization_signature_otp_rate_reservations_source_ip_ck" CHECK (octet_length("formalization_signature_otp_rate_reservations"."source_ip_hash") = 32)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "formalization_signature_gateway_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"kind" "formalization_signature_session_kind" NOT NULL,
	"token_hash" "bytea" NOT NULL,
	"device_secret_hash" "bytea" NOT NULL,
	"csrf_hash" "bytea" NOT NULL,
	"status" "formalization_signature_access_status" NOT NULL,
	"issued_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"revocation_reason" varchar(128),
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "formalization_signature_gateway_sessions_hashes_ck" CHECK (octet_length("formalization_signature_gateway_sessions"."token_hash") = 32 and octet_length("formalization_signature_gateway_sessions"."device_secret_hash") = 32 and octet_length("formalization_signature_gateway_sessions"."csrf_hash") = 32),
	CONSTRAINT "formalization_signature_gateway_sessions_version_ck" CHECK ("formalization_signature_gateway_sessions"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "formalization_signature_document_acknowledgements" (
	"id" uuid PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	"request_document_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"acknowledged_at" timestamp with time zone NOT NULL,
	"source_ip_hash" "bytea",
	"user_agent_hash" "bytea",
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "fs_sig_ack_source_ip_hash_ck" CHECK ("formalization_signature_document_acknowledgements"."source_ip_hash" is null or octet_length("formalization_signature_document_acknowledgements"."source_ip_hash") = 32),
	CONSTRAINT "fs_sig_ack_user_agent_hash_ck" CHECK ("formalization_signature_document_acknowledgements"."user_agent_hash" is null or octet_length("formalization_signature_document_acknowledgements"."user_agent_hash") = 32)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "formalization_signature_proxy_bindings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"session_id" uuid NOT NULL,
	"request_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"alias_hash" "bytea" NOT NULL,
	"encrypted_provider_credential" "bytea" NOT NULL,
	"cipher_key_id" varchar(128) NOT NULL,
	"provider_contract_version" varchar(64) NOT NULL,
	"status" "formalization_signature_access_status" NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"revocation_reason" varchar(128),
	CONSTRAINT "formalization_signature_proxy_bindings_alias_hash_ck" CHECK (octet_length("formalization_signature_proxy_bindings"."alias_hash") = 32)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "formalization_signature_webhook_receipts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"dedupe_key" "bytea" NOT NULL,
	"hint_kind" varchar(32) NOT NULL,
	"encrypted_hint" "bytea" NOT NULL,
	"cipher_key_id" varchar(128) NOT NULL,
	"status" "formalization_signature_webhook_status" NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	"claim_token" varchar(255),
	"lease_until" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone,
	"processed_at" timestamp with time zone,
	CONSTRAINT "formalization_signature_webhook_receipts_dedupe_ck" CHECK (octet_length("formalization_signature_webhook_receipts"."dedupe_key") = 32),
	CONSTRAINT "formalization_signature_webhook_receipts_attempts_ck" CHECK ("formalization_signature_webhook_receipts"."attempts" >= 0),
	CONSTRAINT "formalization_signature_webhook_receipts_hint_kind_ck" CHECK ("formalization_signature_webhook_receipts"."hint_kind" in ('observation', 'reconciliation_only')),
	CONSTRAINT "formalization_signature_webhook_receipts_claim_ck" CHECK (("formalization_signature_webhook_receipts"."status" = 'processing' and "formalization_signature_webhook_receipts"."claim_token" is not null and "formalization_signature_webhook_receipts"."lease_until" is not null) or ("formalization_signature_webhook_receipts"."status" <> 'processing' and "formalization_signature_webhook_receipts"."claim_token" is null and "formalization_signature_webhook_receipts"."lease_until" is null))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "formalization_signature_artifacts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	"request_document_id" uuid,
	"kind" "formalization_signature_artifact_kind" NOT NULL,
	"private_file_id" uuid NOT NULL,
	"sha256" "bytea" NOT NULL,
	"byte_count" bigint NOT NULL,
	"media_type" varchar(128) NOT NULL,
	"provider_reference" varchar(255),
	"preserved_at" timestamp with time zone NOT NULL,
	CONSTRAINT "formalization_signature_artifacts_sha256_ck" CHECK (octet_length("formalization_signature_artifacts"."sha256") = 32),
	CONSTRAINT "formalization_signature_artifacts_byte_count_ck" CHECK ("formalization_signature_artifacts"."byte_count" > 0),
	CONSTRAINT "formalization_signature_artifacts_scope_ck" CHECK (("formalization_signature_artifacts"."kind" = 'signed_pdf' and "formalization_signature_artifacts"."request_document_id" is not null) or ("formalization_signature_artifacts"."kind" <> 'signed_pdf' and "formalization_signature_artifacts"."request_document_id" is null))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "formalization_signature_protocols" (
	"id" uuid PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"number" varchar(128) NOT NULL,
	"artifact_set_hash" "bytea" NOT NULL,
	"confirmed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "formalization_signature_protocols_hash_ck" CHECK (octet_length("formalization_signature_protocols"."artifact_set_hash") = 32)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "formalization_signature_audit_entries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"request_id" uuid,
	"recipient_id" uuid,
	"invitation_id" uuid,
	"session_id" uuid,
	"action" varchar(128) NOT NULL,
	"actor_kind" "formalization_signature_recipient_kind",
	"actor_reference" varchar(255),
	"occurred_at" timestamp with time zone NOT NULL,
	"correlation_id" uuid NOT NULL,
	"source_ip_hash" "bytea",
	"user_agent_hash" "bytea",
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "formalization_signature_audit_entries_source_ip_hash_ck" CHECK ("formalization_signature_audit_entries"."source_ip_hash" is null or octet_length("formalization_signature_audit_entries"."source_ip_hash") = 32),
	CONSTRAINT "formalization_signature_audit_entries_user_agent_hash_ck" CHECK ("formalization_signature_audit_entries"."user_agent_hash" is null or octet_length("formalization_signature_audit_entries"."user_agent_hash") = 32),
	CONSTRAINT "formalization_signature_audit_entries_metadata_ck" CHECK (jsonb_typeof("formalization_signature_audit_entries"."metadata") = 'object')
);
--> statement-breakpoint
--> statement-breakpoint
--> statement-breakpoint
--> statement-breakpoint
--> statement-breakpoint
--> statement-breakpoint
--> statement-breakpoint
--> statement-breakpoint
--> statement-breakpoint
--> statement-breakpoint
--> statement-breakpoint
-- Add repair constraints only when the clean migration chain has not already added them.
DO $repair_constraints$
DECLARE
  constraint_definition record;
BEGIN
  FOR constraint_definition IN
    SELECT *
    FROM (
      VALUES
        ('public.formalization_signatories'::regclass, 'formalization_signatories_formalization_id_formalizations_id_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signatory_documents'::regclass, 'formalization_signatory_documents_formalization_id_formalizations_id_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signatory_documents'::regclass, 'formalization_signatory_documents_signatory_id_formalization_signatories_id_fk', 'FOREIGN KEY ("signatory_id") REFERENCES "public"."formalization_signatories"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signatory_documents'::regclass, 'formalization_signatory_documents_owner_signatory_fk', 'FOREIGN KEY ("formalization_id","signatory_id") REFERENCES "public"."formalization_signatories"("formalization_id","id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_previews'::regclass, 'formalization_signature_previews_formalization_id_formalizations_id_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_previews'::regclass, 'formalization_signature_previews_file_id_stored_files_id_fk', 'FOREIGN KEY ("file_id") REFERENCES "public"."stored_files"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_fields'::regclass, 'formalization_signature_fields_formalization_id_formalizations_id_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_fields'::regclass, 'formalization_signature_fields_signatory_document_id_formalization_signatory_documents_id_fk', 'FOREIGN KEY ("signatory_document_id") REFERENCES "public"."formalization_signatory_documents"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_fields'::regclass, 'formalization_signature_fields_preview_id_formalization_signature_previews_id_fk', 'FOREIGN KEY ("preview_id") REFERENCES "public"."formalization_signature_previews"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_snapshots'::regclass, 'fs_snapshot_formalization_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_requests'::regclass, 'fs_req_formalization_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_requests'::regclass, 'fs_req_snapshot_fk', 'FOREIGN KEY ("snapshot_id") REFERENCES "public"."formalization_signature_snapshots"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_request_documents'::regclass, 'fs_req_doc_req_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_recipients'::regclass, 'fs_recipient_req_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_recipients'::regclass, 'fs_recipient_signatory_fk', 'FOREIGN KEY ("signatory_id") REFERENCES "public"."formalization_signatories"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_recipient_documents'::regclass, 'fs_sig_rec_doc_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_recipient_documents'::regclass, 'fs_sig_rec_doc_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_recipient_documents'::regclass, 'fs_sig_rec_doc_document_fk', 'FOREIGN KEY ("request_document_id") REFERENCES "public"."formalization_signature_request_documents"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_invitations'::regclass, 'fs_invitation_req_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_invitations'::regclass, 'fs_invitation_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_invitation_send_attempts'::regclass, 'fs_inv_send_inv_fk', 'FOREIGN KEY ("invitation_id") REFERENCES "public"."formalization_signature_invitations"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_provider_resources'::regclass, 'fs_sig_provider_resource_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_provider_recipient_resources'::regclass, 'fs_sig_prr_provider_resource_fk', 'FOREIGN KEY ("provider_resource_id") REFERENCES "public"."formalization_signature_provider_resources"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_provider_recipient_resources'::regclass, 'fs_sig_prr_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_provider_document_resources'::regclass, 'fs_sig_pdr_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_provider_document_resources'::regclass, 'fs_sig_pdr_resource_fk', 'FOREIGN KEY ("provider_resource_id") REFERENCES "public"."formalization_signature_provider_resources"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_provider_document_resources'::regclass, 'fs_sig_pdr_document_fk', 'FOREIGN KEY ("request_document_id") REFERENCES "public"."formalization_signature_request_documents"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_provisioning_attempts'::regclass, 'fs_sig_prov_attempt_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_cancellation_attempts'::regclass, 'fs_sig_cancel_attempt_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_otp_guards'::regclass, 'fs_otp_guard_inv_fk', 'FOREIGN KEY ("invitation_id") REFERENCES "public"."formalization_signature_invitations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_otp_challenges'::regclass, 'fs_otp_challenge_inv_fk', 'FOREIGN KEY ("invitation_id") REFERENCES "public"."formalization_signature_invitations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_otp_send_attempts'::regclass, 'fs_otp_send_challenge_fk', 'FOREIGN KEY ("challenge_id") REFERENCES "public"."formalization_signature_otp_challenges"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_otp_rate_reservations'::regclass, 'fs_otp_rate_inv_fk', 'FOREIGN KEY ("invitation_id") REFERENCES "public"."formalization_signature_invitations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_gateway_sessions'::regclass, 'fs_sig_gateway_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_gateway_sessions'::regclass, 'fs_sig_gateway_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_gateway_sessions'::regclass, 'fs_sig_gateway_snapshot_fk', 'FOREIGN KEY ("snapshot_id") REFERENCES "public"."formalization_signature_snapshots"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_document_acknowledgements'::regclass, 'fs_sig_ack_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_document_acknowledgements'::regclass, 'fs_sig_ack_document_fk', 'FOREIGN KEY ("request_document_id") REFERENCES "public"."formalization_signature_request_documents"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_document_acknowledgements'::regclass, 'fs_sig_ack_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_document_acknowledgements'::regclass, 'fs_sig_ack_snapshot_fk', 'FOREIGN KEY ("snapshot_id") REFERENCES "public"."formalization_signature_snapshots"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_document_acknowledgements'::regclass, 'fs_sig_ack_session_fk', 'FOREIGN KEY ("session_id") REFERENCES "public"."formalization_signature_gateway_sessions"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_proxy_bindings'::regclass, 'fs_sig_proxy_session_fk', 'FOREIGN KEY ("session_id") REFERENCES "public"."formalization_signature_gateway_sessions"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_proxy_bindings'::regclass, 'fs_sig_proxy_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_proxy_bindings'::regclass, 'fs_sig_proxy_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_artifacts'::regclass, 'fs_sig_artifact_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_artifacts'::regclass, 'fs_sig_artifact_req_doc_fk', 'FOREIGN KEY ("request_document_id") REFERENCES "public"."formalization_signature_request_documents"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_protocols'::regclass, 'fs_sig_protocol_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_protocols'::regclass, 'fs_sig_protocol_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_audit_entries'::regclass, 'fs_sig_audit_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE set null ON UPDATE no action'),
        ('public.formalization_signature_audit_entries'::regclass, 'fs_sig_audit_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE set null ON UPDATE no action'),
        ('public.formalization_signature_audit_entries'::regclass, 'fs_sig_audit_invitation_fk', 'FOREIGN KEY ("invitation_id") REFERENCES "public"."formalization_signature_invitations"("id") ON DELETE set null ON UPDATE no action'),
        ('public.formalization_signature_audit_entries'::regclass, 'fs_sig_audit_session_fk', 'FOREIGN KEY ("session_id") REFERENCES "public"."formalization_signature_gateway_sessions"("id") ON DELETE set null ON UPDATE no action'),
        ('public.formalization_signature_previews'::regclass, 'fs_sig_preview_formalization_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_previews'::regclass, 'fs_sig_preview_file_fk', 'FOREIGN KEY ("file_id") REFERENCES "public"."stored_files"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_fields'::regclass, 'fs_sig_field_formalization_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_fields'::regclass, 'fs_sig_field_signatory_doc_fk', 'FOREIGN KEY ("signatory_document_id") REFERENCES "public"."formalization_signatory_documents"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_fields'::regclass, 'fs_sig_field_preview_fk', 'FOREIGN KEY ("preview_id") REFERENCES "public"."formalization_signature_previews"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_cancellation_attempts'::regclass, 'formalization_signature_cancellation_attempts_reason_ck', 'CHECK (char_length(btrim("reason")) between 1 and 500)')
    ) AS definitions(table_name, constraint_name, definition)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conrelid = constraint_definition.table_name
        AND conname = left(constraint_definition.constraint_name, 63)
    ) THEN
      EXECUTE format(
        'ALTER TABLE %s ADD CONSTRAINT %I %s',
        constraint_definition.table_name,
        constraint_definition.constraint_name,
        constraint_definition.definition
      );
    END IF;
  END LOOP;
END $repair_constraints$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_snapshots_hash_uq" ON "formalization_signature_snapshots" USING btree ("snapshot_hash");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_snapshots_version_uq" ON "formalization_signature_snapshots" USING btree ("formalization_id","signature_configuration_version");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_requests_confirmation_key_uq" ON "formalization_signature_requests" USING btree ("confirmation_key_hash");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_requests_formalization_version_uq" ON "formalization_signature_requests" USING btree ("formalization_id","signature_configuration_version");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_requests_current_formalization_uq" ON "formalization_signature_requests" USING btree ("formalization_id") WHERE "formalization_signature_requests"."status" not in ('confirmed','rejected','cancelled','expired','failed');
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_requests_status_idx" ON "formalization_signature_requests" USING btree ("status","updated_at");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_request_documents_source_version_uq" ON "formalization_signature_request_documents" USING btree ("request_id","source_document_version_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_request_documents_position_uq" ON "formalization_signature_request_documents" USING btree ("request_id","position");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_request_documents_status_idx" ON "formalization_signature_request_documents" USING btree ("request_id","status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_recipients_request_signatory_uq" ON "formalization_signature_recipients" USING btree ("request_id","signatory_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_recipients_request_id_uq" ON "formalization_signature_recipients" USING btree ("request_id","id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_recipients_submission_observation_uq" ON "formalization_signature_recipients" USING btree ("submission_observation_id") WHERE "formalization_signature_recipients"."submission_observation_id" is not null;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_recipients_request_status_idx" ON "formalization_signature_recipients" USING btree ("request_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_recipients_person_status_idx" ON "formalization_signature_recipients" USING btree ("person_id","status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fs_sig_rec_doc_recipient_document_uq" ON "formalization_signature_recipient_documents" USING btree ("recipient_id","request_document_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fs_sig_rec_doc_request_recipient_idx" ON "formalization_signature_recipient_documents" USING btree ("request_id","recipient_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fs_sig_rec_doc_document_recipient_idx" ON "formalization_signature_recipient_documents" USING btree ("request_document_id","recipient_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_invitations_token_hash_uq" ON "formalization_signature_invitations" USING btree ("token_hash");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_invitations_recipient_generation_uq" ON "formalization_signature_invitations" USING btree ("recipient_id","generation");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_invitations_active_recipient_uq" ON "formalization_signature_invitations" USING btree ("recipient_id") WHERE "formalization_signature_invitations"."status" = 'active';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_invitations_request_status_idx" ON "formalization_signature_invitations" USING btree ("request_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_invitations_delivery_idx" ON "formalization_signature_invitations" USING btree ("delivery_status","expires_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_invitations_expiry_idx" ON "formalization_signature_invitations" USING btree ("expires_at","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_invitation_send_attempts_work_idx" ON "formalization_signature_invitation_send_attempts" USING btree ("status","next_attempt_at");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fs_sig_provider_resource_request_uq" ON "formalization_signature_provider_resources" USING btree ("request_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fs_sig_provider_resource_request_id_uq" ON "formalization_signature_provider_resources" USING btree ("request_id","id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_provider_resources_envelope_uq" ON "formalization_signature_provider_resources" USING btree ("provider_envelope_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_provider_resources_external_uq" ON "formalization_signature_provider_resources" USING btree ("provider_external_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_provider_resources_idempotency_uq" ON "formalization_signature_provider_resources" USING btree ("idempotency_key");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fs_sig_prr_recipient_uq" ON "formalization_signature_provider_recipient_resources" USING btree ("recipient_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_provider_recipient_resources_provider_id_uq" ON "formalization_signature_provider_recipient_resources" USING btree ("provider_recipient_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_provider_recipient_resources_pair_uq" ON "formalization_signature_provider_recipient_resources" USING btree ("provider_resource_id","provider_recipient_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_provider_recipient_resources_recipient_idx" ON "formalization_signature_provider_recipient_resources" USING btree ("recipient_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fs_sig_pdr_request_document_uq" ON "formalization_signature_provider_document_resources" USING btree ("request_document_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fs_sig_pdr_envelope_item_uq" ON "formalization_signature_provider_document_resources" USING btree ("provider_envelope_item_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fs_sig_pdr_resource_item_uq" ON "formalization_signature_provider_document_resources" USING btree ("provider_resource_id","provider_envelope_item_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fs_sig_prov_attempt_request_uq" ON "formalization_signature_provisioning_attempts" USING btree ("request_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_provisioning_attempts_work_idx" ON "formalization_signature_provisioning_attempts" USING btree ("status","next_attempt_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_provisioning_attempts_lease_idx" ON "formalization_signature_provisioning_attempts" USING btree ("lease_expires_at");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fs_sig_cancel_attempt_request_uq" ON "formalization_signature_cancellation_attempts" USING btree ("request_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_cancellation_attempts_work_idx" ON "formalization_signature_cancellation_attempts" USING btree ("status","next_attempt_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_cancellation_attempts_lease_idx" ON "formalization_signature_cancellation_attempts" USING btree ("lease_expires_at");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_otp_challenges_invitation_generation_uq" ON "formalization_signature_otp_challenges" USING btree ("invitation_id","generation");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_otp_challenges_current_invitation_uq" ON "formalization_signature_otp_challenges" USING btree ("invitation_id") WHERE "formalization_signature_otp_challenges"."status" in ('pending_delivery','active');
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_otp_challenges_invitation_status_idx" ON "formalization_signature_otp_challenges" USING btree ("invitation_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_otp_send_attempts_work_idx" ON "formalization_signature_otp_send_attempts" USING btree ("status","next_attempt_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_otp_rate_reservations_invitation_idx" ON "formalization_signature_otp_rate_reservations" USING btree ("invitation_id","reserved_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_otp_rate_reservations_source_ip_idx" ON "formalization_signature_otp_rate_reservations" USING btree ("source_ip_hash","reserved_at");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_gateway_sessions_token_hash_uq" ON "formalization_signature_gateway_sessions" USING btree ("token_hash");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_gateway_sessions_active_device_uq" ON "formalization_signature_gateway_sessions" USING btree ("recipient_id","device_secret_hash") WHERE "formalization_signature_gateway_sessions"."status" = 'active' and "formalization_signature_gateway_sessions"."kind" = 'authenticated';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_gateway_sessions_recipient_status_idx" ON "formalization_signature_gateway_sessions" USING btree ("recipient_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_gateway_sessions_expiry_idx" ON "formalization_signature_gateway_sessions" USING btree ("expires_at","status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fs_sig_ack_recipient_document_snapshot_uq" ON "formalization_signature_document_acknowledgements" USING btree ("recipient_id","request_document_id","snapshot_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fs_sig_ack_recipient_snapshot_idx" ON "formalization_signature_document_acknowledgements" USING btree ("recipient_id","snapshot_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_proxy_bindings_alias_hash_uq" ON "formalization_signature_proxy_bindings" USING btree ("alias_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_proxy_bindings_recipient_status_idx" ON "formalization_signature_proxy_bindings" USING btree ("recipient_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_proxy_bindings_expiry_idx" ON "formalization_signature_proxy_bindings" USING btree ("expires_at","status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_webhook_receipts_dedupe_uq" ON "formalization_signature_webhook_receipts" USING btree ("dedupe_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_webhook_receipts_work_idx" ON "formalization_signature_webhook_receipts" USING btree ("status","next_attempt_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_webhook_receipts_lease_idx" ON "formalization_signature_webhook_receipts" USING btree ("lease_until");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_artifacts_document_kind_uq" ON "formalization_signature_artifacts" USING btree ("request_document_id","kind") WHERE "formalization_signature_artifacts"."request_document_id" is not null;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_artifacts_request_kind_uq" ON "formalization_signature_artifacts" USING btree ("request_id","kind") WHERE "formalization_signature_artifacts"."request_document_id" is null;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_protocols_number_uq" ON "formalization_signature_protocols" USING btree ("number");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "formalization_signature_protocols_recipient_request_uq" ON "formalization_signature_protocols" USING btree ("recipient_id","request_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_audit_entries_request_idx" ON "formalization_signature_audit_entries" USING btree ("request_id","occurred_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_audit_entries_recipient_idx" ON "formalization_signature_audit_entries" USING btree ("recipient_id","occurred_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "formalization_signature_audit_entries_correlation_idx" ON "formalization_signature_audit_entries" USING btree ("correlation_id");
--> statement-breakpoint
-- Add repair constraints only when the clean migration chain has not already added them.
DO $repair_constraints$
DECLARE
  constraint_definition record;
BEGIN
  FOR constraint_definition IN
    SELECT *
    FROM (
      VALUES
        ('public.formalization_signatories'::regclass, 'formalization_signatories_formalization_id_formalizations_id_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signatory_documents'::regclass, 'formalization_signatory_documents_formalization_id_formalizations_id_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signatory_documents'::regclass, 'formalization_signatory_documents_signatory_id_formalization_signatories_id_fk', 'FOREIGN KEY ("signatory_id") REFERENCES "public"."formalization_signatories"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signatory_documents'::regclass, 'formalization_signatory_documents_owner_signatory_fk', 'FOREIGN KEY ("formalization_id","signatory_id") REFERENCES "public"."formalization_signatories"("formalization_id","id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_previews'::regclass, 'formalization_signature_previews_formalization_id_formalizations_id_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_previews'::regclass, 'formalization_signature_previews_file_id_stored_files_id_fk', 'FOREIGN KEY ("file_id") REFERENCES "public"."stored_files"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_fields'::regclass, 'formalization_signature_fields_formalization_id_formalizations_id_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_fields'::regclass, 'formalization_signature_fields_signatory_document_id_formalization_signatory_documents_id_fk', 'FOREIGN KEY ("signatory_document_id") REFERENCES "public"."formalization_signatory_documents"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_fields'::regclass, 'formalization_signature_fields_preview_id_formalization_signature_previews_id_fk', 'FOREIGN KEY ("preview_id") REFERENCES "public"."formalization_signature_previews"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_snapshots'::regclass, 'fs_snapshot_formalization_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_requests'::regclass, 'fs_req_formalization_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_requests'::regclass, 'fs_req_snapshot_fk', 'FOREIGN KEY ("snapshot_id") REFERENCES "public"."formalization_signature_snapshots"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_request_documents'::regclass, 'fs_req_doc_req_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_recipients'::regclass, 'fs_recipient_req_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_recipients'::regclass, 'fs_recipient_signatory_fk', 'FOREIGN KEY ("signatory_id") REFERENCES "public"."formalization_signatories"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_recipient_documents'::regclass, 'fs_sig_rec_doc_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_recipient_documents'::regclass, 'fs_sig_rec_doc_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_recipient_documents'::regclass, 'fs_sig_rec_doc_document_fk', 'FOREIGN KEY ("request_document_id") REFERENCES "public"."formalization_signature_request_documents"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_invitations'::regclass, 'fs_invitation_req_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_invitations'::regclass, 'fs_invitation_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_invitation_send_attempts'::regclass, 'fs_inv_send_inv_fk', 'FOREIGN KEY ("invitation_id") REFERENCES "public"."formalization_signature_invitations"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_provider_resources'::regclass, 'fs_sig_provider_resource_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_provider_recipient_resources'::regclass, 'fs_sig_prr_provider_resource_fk', 'FOREIGN KEY ("provider_resource_id") REFERENCES "public"."formalization_signature_provider_resources"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_provider_recipient_resources'::regclass, 'fs_sig_prr_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_provider_document_resources'::regclass, 'fs_sig_pdr_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_provider_document_resources'::regclass, 'fs_sig_pdr_resource_fk', 'FOREIGN KEY ("provider_resource_id") REFERENCES "public"."formalization_signature_provider_resources"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_provider_document_resources'::regclass, 'fs_sig_pdr_document_fk', 'FOREIGN KEY ("request_document_id") REFERENCES "public"."formalization_signature_request_documents"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_provisioning_attempts'::regclass, 'fs_sig_prov_attempt_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_cancellation_attempts'::regclass, 'fs_sig_cancel_attempt_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_otp_guards'::regclass, 'fs_otp_guard_inv_fk', 'FOREIGN KEY ("invitation_id") REFERENCES "public"."formalization_signature_invitations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_otp_challenges'::regclass, 'fs_otp_challenge_inv_fk', 'FOREIGN KEY ("invitation_id") REFERENCES "public"."formalization_signature_invitations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_otp_send_attempts'::regclass, 'fs_otp_send_challenge_fk', 'FOREIGN KEY ("challenge_id") REFERENCES "public"."formalization_signature_otp_challenges"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_otp_rate_reservations'::regclass, 'fs_otp_rate_inv_fk', 'FOREIGN KEY ("invitation_id") REFERENCES "public"."formalization_signature_invitations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_gateway_sessions'::regclass, 'fs_sig_gateway_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_gateway_sessions'::regclass, 'fs_sig_gateway_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_gateway_sessions'::regclass, 'fs_sig_gateway_snapshot_fk', 'FOREIGN KEY ("snapshot_id") REFERENCES "public"."formalization_signature_snapshots"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_document_acknowledgements'::regclass, 'fs_sig_ack_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_document_acknowledgements'::regclass, 'fs_sig_ack_document_fk', 'FOREIGN KEY ("request_document_id") REFERENCES "public"."formalization_signature_request_documents"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_document_acknowledgements'::regclass, 'fs_sig_ack_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_document_acknowledgements'::regclass, 'fs_sig_ack_snapshot_fk', 'FOREIGN KEY ("snapshot_id") REFERENCES "public"."formalization_signature_snapshots"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_document_acknowledgements'::regclass, 'fs_sig_ack_session_fk', 'FOREIGN KEY ("session_id") REFERENCES "public"."formalization_signature_gateway_sessions"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_proxy_bindings'::regclass, 'fs_sig_proxy_session_fk', 'FOREIGN KEY ("session_id") REFERENCES "public"."formalization_signature_gateway_sessions"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_proxy_bindings'::regclass, 'fs_sig_proxy_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_proxy_bindings'::regclass, 'fs_sig_proxy_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_artifacts'::regclass, 'fs_sig_artifact_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_artifacts'::regclass, 'fs_sig_artifact_req_doc_fk', 'FOREIGN KEY ("request_document_id") REFERENCES "public"."formalization_signature_request_documents"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_protocols'::regclass, 'fs_sig_protocol_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_protocols'::regclass, 'fs_sig_protocol_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_audit_entries'::regclass, 'fs_sig_audit_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE set null ON UPDATE no action'),
        ('public.formalization_signature_audit_entries'::regclass, 'fs_sig_audit_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE set null ON UPDATE no action'),
        ('public.formalization_signature_audit_entries'::regclass, 'fs_sig_audit_invitation_fk', 'FOREIGN KEY ("invitation_id") REFERENCES "public"."formalization_signature_invitations"("id") ON DELETE set null ON UPDATE no action'),
        ('public.formalization_signature_audit_entries'::regclass, 'fs_sig_audit_session_fk', 'FOREIGN KEY ("session_id") REFERENCES "public"."formalization_signature_gateway_sessions"("id") ON DELETE set null ON UPDATE no action'),
        ('public.formalization_signature_previews'::regclass, 'fs_sig_preview_formalization_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_previews'::regclass, 'fs_sig_preview_file_fk', 'FOREIGN KEY ("file_id") REFERENCES "public"."stored_files"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_fields'::regclass, 'fs_sig_field_formalization_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_fields'::regclass, 'fs_sig_field_signatory_doc_fk', 'FOREIGN KEY ("signatory_document_id") REFERENCES "public"."formalization_signatory_documents"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_fields'::regclass, 'fs_sig_field_preview_fk', 'FOREIGN KEY ("preview_id") REFERENCES "public"."formalization_signature_previews"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_cancellation_attempts'::regclass, 'formalization_signature_cancellation_attempts_reason_ck', 'CHECK (char_length(btrim("reason")) between 1 and 500)')
    ) AS definitions(table_name, constraint_name, definition)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conrelid = constraint_definition.table_name
        AND conname = left(constraint_definition.constraint_name, 63)
    ) THEN
      EXECUTE format(
        'ALTER TABLE %s ADD CONSTRAINT %I %s',
        constraint_definition.table_name,
        constraint_definition.constraint_name,
        constraint_definition.definition
      );
    END IF;
  END LOOP;
END $repair_constraints$;
--> statement-breakpoint
ALTER TABLE "formalization_signature_cancellation_attempts" ADD COLUMN IF NOT EXISTS "reason" varchar(500);
--> statement-breakpoint
UPDATE "formalization_signature_cancellation_attempts" SET "reason" = 'Motivo indisponível: solicitação anterior à obrigatoriedade.' WHERE "reason" IS NULL;
--> statement-breakpoint
ALTER TABLE "formalization_signature_cancellation_attempts" ALTER COLUMN "reason" SET NOT NULL;
--> statement-breakpoint
-- Add repair constraints only when the clean migration chain has not already added them.
DO $repair_constraints$
DECLARE
  constraint_definition record;
BEGIN
  FOR constraint_definition IN
    SELECT *
    FROM (
      VALUES
        ('public.formalization_signatories'::regclass, 'formalization_signatories_formalization_id_formalizations_id_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signatory_documents'::regclass, 'formalization_signatory_documents_formalization_id_formalizations_id_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signatory_documents'::regclass, 'formalization_signatory_documents_signatory_id_formalization_signatories_id_fk', 'FOREIGN KEY ("signatory_id") REFERENCES "public"."formalization_signatories"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signatory_documents'::regclass, 'formalization_signatory_documents_owner_signatory_fk', 'FOREIGN KEY ("formalization_id","signatory_id") REFERENCES "public"."formalization_signatories"("formalization_id","id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_previews'::regclass, 'formalization_signature_previews_formalization_id_formalizations_id_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_previews'::regclass, 'formalization_signature_previews_file_id_stored_files_id_fk', 'FOREIGN KEY ("file_id") REFERENCES "public"."stored_files"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_fields'::regclass, 'formalization_signature_fields_formalization_id_formalizations_id_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_fields'::regclass, 'formalization_signature_fields_signatory_document_id_formalization_signatory_documents_id_fk', 'FOREIGN KEY ("signatory_document_id") REFERENCES "public"."formalization_signatory_documents"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_fields'::regclass, 'formalization_signature_fields_preview_id_formalization_signature_previews_id_fk', 'FOREIGN KEY ("preview_id") REFERENCES "public"."formalization_signature_previews"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_snapshots'::regclass, 'fs_snapshot_formalization_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_requests'::regclass, 'fs_req_formalization_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_requests'::regclass, 'fs_req_snapshot_fk', 'FOREIGN KEY ("snapshot_id") REFERENCES "public"."formalization_signature_snapshots"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_request_documents'::regclass, 'fs_req_doc_req_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_recipients'::regclass, 'fs_recipient_req_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_recipients'::regclass, 'fs_recipient_signatory_fk', 'FOREIGN KEY ("signatory_id") REFERENCES "public"."formalization_signatories"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_recipient_documents'::regclass, 'fs_sig_rec_doc_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_recipient_documents'::regclass, 'fs_sig_rec_doc_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_recipient_documents'::regclass, 'fs_sig_rec_doc_document_fk', 'FOREIGN KEY ("request_document_id") REFERENCES "public"."formalization_signature_request_documents"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_invitations'::regclass, 'fs_invitation_req_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_invitations'::regclass, 'fs_invitation_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_invitation_send_attempts'::regclass, 'fs_inv_send_inv_fk', 'FOREIGN KEY ("invitation_id") REFERENCES "public"."formalization_signature_invitations"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_provider_resources'::regclass, 'fs_sig_provider_resource_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_provider_recipient_resources'::regclass, 'fs_sig_prr_provider_resource_fk', 'FOREIGN KEY ("provider_resource_id") REFERENCES "public"."formalization_signature_provider_resources"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_provider_recipient_resources'::regclass, 'fs_sig_prr_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_provider_document_resources'::regclass, 'fs_sig_pdr_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_provider_document_resources'::regclass, 'fs_sig_pdr_resource_fk', 'FOREIGN KEY ("provider_resource_id") REFERENCES "public"."formalization_signature_provider_resources"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_provider_document_resources'::regclass, 'fs_sig_pdr_document_fk', 'FOREIGN KEY ("request_document_id") REFERENCES "public"."formalization_signature_request_documents"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_provisioning_attempts'::regclass, 'fs_sig_prov_attempt_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_cancellation_attempts'::regclass, 'fs_sig_cancel_attempt_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_otp_guards'::regclass, 'fs_otp_guard_inv_fk', 'FOREIGN KEY ("invitation_id") REFERENCES "public"."formalization_signature_invitations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_otp_challenges'::regclass, 'fs_otp_challenge_inv_fk', 'FOREIGN KEY ("invitation_id") REFERENCES "public"."formalization_signature_invitations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_otp_send_attempts'::regclass, 'fs_otp_send_challenge_fk', 'FOREIGN KEY ("challenge_id") REFERENCES "public"."formalization_signature_otp_challenges"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_otp_rate_reservations'::regclass, 'fs_otp_rate_inv_fk', 'FOREIGN KEY ("invitation_id") REFERENCES "public"."formalization_signature_invitations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_gateway_sessions'::regclass, 'fs_sig_gateway_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_gateway_sessions'::regclass, 'fs_sig_gateway_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_gateway_sessions'::regclass, 'fs_sig_gateway_snapshot_fk', 'FOREIGN KEY ("snapshot_id") REFERENCES "public"."formalization_signature_snapshots"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_document_acknowledgements'::regclass, 'fs_sig_ack_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_document_acknowledgements'::regclass, 'fs_sig_ack_document_fk', 'FOREIGN KEY ("request_document_id") REFERENCES "public"."formalization_signature_request_documents"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_document_acknowledgements'::regclass, 'fs_sig_ack_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_document_acknowledgements'::regclass, 'fs_sig_ack_snapshot_fk', 'FOREIGN KEY ("snapshot_id") REFERENCES "public"."formalization_signature_snapshots"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_document_acknowledgements'::regclass, 'fs_sig_ack_session_fk', 'FOREIGN KEY ("session_id") REFERENCES "public"."formalization_signature_gateway_sessions"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_proxy_bindings'::regclass, 'fs_sig_proxy_session_fk', 'FOREIGN KEY ("session_id") REFERENCES "public"."formalization_signature_gateway_sessions"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_proxy_bindings'::regclass, 'fs_sig_proxy_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_proxy_bindings'::regclass, 'fs_sig_proxy_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_artifacts'::regclass, 'fs_sig_artifact_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_artifacts'::regclass, 'fs_sig_artifact_req_doc_fk', 'FOREIGN KEY ("request_document_id") REFERENCES "public"."formalization_signature_request_documents"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_protocols'::regclass, 'fs_sig_protocol_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_protocols'::regclass, 'fs_sig_protocol_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_audit_entries'::regclass, 'fs_sig_audit_request_fk', 'FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE set null ON UPDATE no action'),
        ('public.formalization_signature_audit_entries'::regclass, 'fs_sig_audit_recipient_fk', 'FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE set null ON UPDATE no action'),
        ('public.formalization_signature_audit_entries'::regclass, 'fs_sig_audit_invitation_fk', 'FOREIGN KEY ("invitation_id") REFERENCES "public"."formalization_signature_invitations"("id") ON DELETE set null ON UPDATE no action'),
        ('public.formalization_signature_audit_entries'::regclass, 'fs_sig_audit_session_fk', 'FOREIGN KEY ("session_id") REFERENCES "public"."formalization_signature_gateway_sessions"("id") ON DELETE set null ON UPDATE no action'),
        ('public.formalization_signature_previews'::regclass, 'fs_sig_preview_formalization_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_previews'::regclass, 'fs_sig_preview_file_fk', 'FOREIGN KEY ("file_id") REFERENCES "public"."stored_files"("id") ON DELETE restrict ON UPDATE no action'),
        ('public.formalization_signature_fields'::regclass, 'fs_sig_field_formalization_fk', 'FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_fields'::regclass, 'fs_sig_field_signatory_doc_fk', 'FOREIGN KEY ("signatory_document_id") REFERENCES "public"."formalization_signatory_documents"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_fields'::regclass, 'fs_sig_field_preview_fk', 'FOREIGN KEY ("preview_id") REFERENCES "public"."formalization_signature_previews"("id") ON DELETE cascade ON UPDATE no action'),
        ('public.formalization_signature_cancellation_attempts'::regclass, 'formalization_signature_cancellation_attempts_reason_ck', 'CHECK (char_length(btrim("reason")) between 1 and 500)')
    ) AS definitions(table_name, constraint_name, definition)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conrelid = constraint_definition.table_name
        AND conname = left(constraint_definition.constraint_name, 63)
    ) THEN
      EXECUTE format(
        'ALTER TABLE %s ADD CONSTRAINT %I %s',
        constraint_definition.table_name,
        constraint_definition.constraint_name,
        constraint_definition.definition
      );
    END IF;
  END LOOP;
END $repair_constraints$;
--> statement-breakpoint
