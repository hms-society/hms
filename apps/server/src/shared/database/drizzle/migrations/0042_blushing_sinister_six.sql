CREATE TYPE "public"."formalization_signature_request_status" AS ENUM('provisioning', 'sending', 'sent', 'in_progress', 'partially_submitted', 'submitted', 'reconciliation_required', 'confirmed', 'rejected', 'cancelled', 'expired', 'failed');--> statement-breakpoint
CREATE TYPE "public"."formalization_signature_request_document_status" AS ENUM('pending', 'processing', 'provisioned', 'delivery_pending', 'sent', 'submitted', 'reconciliation_required', 'confirmed', 'rejected', 'cancelled', 'expired', 'failed');--> statement-breakpoint
CREATE TYPE "public"."formalization_signature_recipient_kind" AS ENUM('client', 'collaborator');--> statement-breakpoint
CREATE TYPE "public"."formalization_signature_recipient_status" AS ENUM('invited', 'authenticating', 'locked', 'authenticated', 'reading', 'signing', 'submitted', 'reconciliation_required', 'confirmed', 'rejected', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."formalization_signature_invitation_status" AS ENUM('active', 'consumed', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "public"."formalization_signature_delivery_status" AS ENUM('pending', 'delivered', 'failed');--> statement-breakpoint
CREATE TYPE "public"."formalization_signature_provider" AS ENUM('documenso');--> statement-breakpoint
CREATE TYPE "public"."formalization_signature_provisioning_attempt_status" AS ENUM('pending', 'processing', 'provisioned', 'reconciliation_required', 'failed');--> statement-breakpoint
CREATE TYPE "public"."formalization_signature_cancellation_attempt_status" AS ENUM('pending', 'processing', 'cancelled', 'failed');--> statement-breakpoint
CREATE TYPE "public"."formalization_signature_otp_challenge_status" AS ENUM('pending_delivery', 'active', 'consumed', 'superseded', 'expired', 'delivery_failed');--> statement-breakpoint
CREATE TYPE "public"."formalization_signature_session_kind" AS ENUM('flow', 'authenticated', 'result');--> statement-breakpoint
CREATE TYPE "public"."formalization_signature_access_status" AS ENUM('active', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "public"."formalization_signature_artifact_kind" AS ENUM('signed_pdf', 'provider_certificate', 'provider_evidence');--> statement-breakpoint
CREATE TYPE "public"."formalization_signature_webhook_status" AS ENUM('pending', 'processing', 'processed', 'failed');--> statement-breakpoint
CREATE TABLE "formalization_signature_snapshots" (
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
CREATE TABLE "formalization_signature_requests" (
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
CREATE TABLE "formalization_signature_request_documents" (
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
CREATE TABLE "formalization_signature_recipients" (
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
CREATE TABLE "formalization_signature_recipient_documents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"request_document_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "formalization_signature_invitations" (
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
CREATE TABLE "formalization_signature_invitation_send_attempts" (
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
CREATE TABLE "formalization_signature_provider_resources" (
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
CREATE TABLE "formalization_signature_provider_recipient_resources" (
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
CREATE TABLE "formalization_signature_provider_document_resources" (
	"id" uuid PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	"provider_resource_id" uuid NOT NULL,
	"request_document_id" uuid NOT NULL,
	"provider_envelope_item_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "formalization_signature_provisioning_attempts" (
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
CREATE TABLE "formalization_signature_cancellation_attempts" (
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
CREATE TABLE "formalization_signature_otp_guards" (
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
CREATE TABLE "formalization_signature_otp_challenges" (
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
CREATE TABLE "formalization_signature_otp_send_attempts" (
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
CREATE TABLE "formalization_signature_otp_rate_reservations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"invitation_id" uuid NOT NULL,
	"source_ip_hash" "bytea" NOT NULL,
	"reserved_at" timestamp with time zone NOT NULL,
	CONSTRAINT "formalization_signature_otp_rate_reservations_source_ip_ck" CHECK (octet_length("formalization_signature_otp_rate_reservations"."source_ip_hash") = 32)
);
--> statement-breakpoint
CREATE TABLE "formalization_signature_gateway_sessions" (
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
CREATE TABLE "formalization_signature_document_acknowledgements" (
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
CREATE TABLE "formalization_signature_proxy_bindings" (
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
CREATE TABLE "formalization_signature_webhook_receipts" (
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
CREATE TABLE "formalization_signature_artifacts" (
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
CREATE TABLE "formalization_signature_protocols" (
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
CREATE TABLE "formalization_signature_audit_entries" (
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
ALTER TABLE "formalization_signature_previews" DROP CONSTRAINT "formalization_signature_previews_formalization_id_formalizations_id_fk";
--> statement-breakpoint
ALTER TABLE "formalization_signature_previews" DROP CONSTRAINT "formalization_signature_previews_file_id_stored_files_id_fk";
--> statement-breakpoint
ALTER TABLE "formalization_signature_fields" DROP CONSTRAINT "formalization_signature_fields_formalization_id_formalizations_id_fk";
--> statement-breakpoint
ALTER TABLE "formalization_signature_fields" DROP CONSTRAINT "formalization_signature_fields_signatory_document_id_formalization_signatory_documents_id_fk";
--> statement-breakpoint
ALTER TABLE "formalization_signature_fields" DROP CONSTRAINT "formalization_signature_fields_preview_id_formalization_signature_previews_id_fk";
--> statement-breakpoint
ALTER TABLE "formalizations" ADD COLUMN "signature_request_id" uuid;--> statement-breakpoint
ALTER TABLE "formalizations" ADD COLUMN "signature_status" "formalization_signature_request_status";--> statement-breakpoint
ALTER TABLE "formalizations" ADD COLUMN "signature_submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "formalizations" ADD COLUMN "signature_confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "formalizations" ADD COLUMN "signature_terminal_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "formalization_signature_snapshots" ADD CONSTRAINT "fs_snapshot_formalization_fk" FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_requests" ADD CONSTRAINT "fs_req_formalization_fk" FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_requests" ADD CONSTRAINT "fs_req_snapshot_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."formalization_signature_snapshots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_request_documents" ADD CONSTRAINT "fs_req_doc_req_fk" FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_recipients" ADD CONSTRAINT "fs_recipient_req_fk" FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_recipients" ADD CONSTRAINT "fs_recipient_signatory_fk" FOREIGN KEY ("signatory_id") REFERENCES "public"."formalization_signatories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_recipient_documents" ADD CONSTRAINT "fs_sig_rec_doc_request_fk" FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_recipient_documents" ADD CONSTRAINT "fs_sig_rec_doc_recipient_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_recipient_documents" ADD CONSTRAINT "fs_sig_rec_doc_document_fk" FOREIGN KEY ("request_document_id") REFERENCES "public"."formalization_signature_request_documents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_invitations" ADD CONSTRAINT "fs_invitation_req_fk" FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_invitations" ADD CONSTRAINT "fs_invitation_recipient_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_invitation_send_attempts" ADD CONSTRAINT "fs_inv_send_inv_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."formalization_signature_invitations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_provider_resources" ADD CONSTRAINT "fs_sig_provider_resource_request_fk" FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_provider_recipient_resources" ADD CONSTRAINT "fs_sig_prr_provider_resource_fk" FOREIGN KEY ("provider_resource_id") REFERENCES "public"."formalization_signature_provider_resources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_provider_recipient_resources" ADD CONSTRAINT "fs_sig_prr_recipient_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_provider_document_resources" ADD CONSTRAINT "fs_sig_pdr_request_fk" FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_provider_document_resources" ADD CONSTRAINT "fs_sig_pdr_resource_fk" FOREIGN KEY ("provider_resource_id") REFERENCES "public"."formalization_signature_provider_resources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_provider_document_resources" ADD CONSTRAINT "fs_sig_pdr_document_fk" FOREIGN KEY ("request_document_id") REFERENCES "public"."formalization_signature_request_documents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_provisioning_attempts" ADD CONSTRAINT "fs_sig_prov_attempt_request_fk" FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_cancellation_attempts" ADD CONSTRAINT "fs_sig_cancel_attempt_request_fk" FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_otp_guards" ADD CONSTRAINT "fs_otp_guard_inv_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."formalization_signature_invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_otp_challenges" ADD CONSTRAINT "fs_otp_challenge_inv_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."formalization_signature_invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_otp_send_attempts" ADD CONSTRAINT "fs_otp_send_challenge_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."formalization_signature_otp_challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_otp_rate_reservations" ADD CONSTRAINT "fs_otp_rate_inv_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."formalization_signature_invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_gateway_sessions" ADD CONSTRAINT "fs_sig_gateway_request_fk" FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_gateway_sessions" ADD CONSTRAINT "fs_sig_gateway_recipient_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_gateway_sessions" ADD CONSTRAINT "fs_sig_gateway_snapshot_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."formalization_signature_snapshots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_document_acknowledgements" ADD CONSTRAINT "fs_sig_ack_request_fk" FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_document_acknowledgements" ADD CONSTRAINT "fs_sig_ack_document_fk" FOREIGN KEY ("request_document_id") REFERENCES "public"."formalization_signature_request_documents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_document_acknowledgements" ADD CONSTRAINT "fs_sig_ack_recipient_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_document_acknowledgements" ADD CONSTRAINT "fs_sig_ack_snapshot_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."formalization_signature_snapshots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_document_acknowledgements" ADD CONSTRAINT "fs_sig_ack_session_fk" FOREIGN KEY ("session_id") REFERENCES "public"."formalization_signature_gateway_sessions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_proxy_bindings" ADD CONSTRAINT "fs_sig_proxy_session_fk" FOREIGN KEY ("session_id") REFERENCES "public"."formalization_signature_gateway_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_proxy_bindings" ADD CONSTRAINT "fs_sig_proxy_request_fk" FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_proxy_bindings" ADD CONSTRAINT "fs_sig_proxy_recipient_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_artifacts" ADD CONSTRAINT "fs_sig_artifact_request_fk" FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_artifacts" ADD CONSTRAINT "fs_sig_artifact_req_doc_fk" FOREIGN KEY ("request_document_id") REFERENCES "public"."formalization_signature_request_documents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_protocols" ADD CONSTRAINT "fs_sig_protocol_request_fk" FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_protocols" ADD CONSTRAINT "fs_sig_protocol_recipient_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_audit_entries" ADD CONSTRAINT "fs_sig_audit_request_fk" FOREIGN KEY ("request_id") REFERENCES "public"."formalization_signature_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_audit_entries" ADD CONSTRAINT "fs_sig_audit_recipient_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."formalization_signature_recipients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_audit_entries" ADD CONSTRAINT "fs_sig_audit_invitation_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."formalization_signature_invitations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_audit_entries" ADD CONSTRAINT "fs_sig_audit_session_fk" FOREIGN KEY ("session_id") REFERENCES "public"."formalization_signature_gateway_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_snapshots_hash_uq" ON "formalization_signature_snapshots" USING btree ("snapshot_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_snapshots_version_uq" ON "formalization_signature_snapshots" USING btree ("formalization_id","signature_configuration_version");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_requests_confirmation_key_uq" ON "formalization_signature_requests" USING btree ("confirmation_key_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_requests_formalization_version_uq" ON "formalization_signature_requests" USING btree ("formalization_id","signature_configuration_version");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_requests_current_formalization_uq" ON "formalization_signature_requests" USING btree ("formalization_id") WHERE "formalization_signature_requests"."status" not in ('confirmed','rejected','cancelled','expired','failed');--> statement-breakpoint
CREATE INDEX "formalization_signature_requests_status_idx" ON "formalization_signature_requests" USING btree ("status","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_request_documents_source_version_uq" ON "formalization_signature_request_documents" USING btree ("request_id","source_document_version_id");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_request_documents_position_uq" ON "formalization_signature_request_documents" USING btree ("request_id","position");--> statement-breakpoint
CREATE INDEX "formalization_signature_request_documents_status_idx" ON "formalization_signature_request_documents" USING btree ("request_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_recipients_request_signatory_uq" ON "formalization_signature_recipients" USING btree ("request_id","signatory_id");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_recipients_request_id_uq" ON "formalization_signature_recipients" USING btree ("request_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_recipients_submission_observation_uq" ON "formalization_signature_recipients" USING btree ("submission_observation_id") WHERE "formalization_signature_recipients"."submission_observation_id" is not null;--> statement-breakpoint
CREATE INDEX "formalization_signature_recipients_request_status_idx" ON "formalization_signature_recipients" USING btree ("request_id","status");--> statement-breakpoint
CREATE INDEX "formalization_signature_recipients_person_status_idx" ON "formalization_signature_recipients" USING btree ("person_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "fs_sig_rec_doc_recipient_document_uq" ON "formalization_signature_recipient_documents" USING btree ("recipient_id","request_document_id");--> statement-breakpoint
CREATE INDEX "fs_sig_rec_doc_request_recipient_idx" ON "formalization_signature_recipient_documents" USING btree ("request_id","recipient_id");--> statement-breakpoint
CREATE INDEX "fs_sig_rec_doc_document_recipient_idx" ON "formalization_signature_recipient_documents" USING btree ("request_document_id","recipient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_invitations_token_hash_uq" ON "formalization_signature_invitations" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_invitations_recipient_generation_uq" ON "formalization_signature_invitations" USING btree ("recipient_id","generation");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_invitations_active_recipient_uq" ON "formalization_signature_invitations" USING btree ("recipient_id") WHERE "formalization_signature_invitations"."status" = 'active';--> statement-breakpoint
CREATE INDEX "formalization_signature_invitations_request_status_idx" ON "formalization_signature_invitations" USING btree ("request_id","status");--> statement-breakpoint
CREATE INDEX "formalization_signature_invitations_delivery_idx" ON "formalization_signature_invitations" USING btree ("delivery_status","expires_at");--> statement-breakpoint
CREATE INDEX "formalization_signature_invitations_expiry_idx" ON "formalization_signature_invitations" USING btree ("expires_at","status");--> statement-breakpoint
CREATE INDEX "formalization_signature_invitation_send_attempts_work_idx" ON "formalization_signature_invitation_send_attempts" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE UNIQUE INDEX "fs_sig_provider_resource_request_uq" ON "formalization_signature_provider_resources" USING btree ("request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fs_sig_provider_resource_request_id_uq" ON "formalization_signature_provider_resources" USING btree ("request_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_provider_resources_envelope_uq" ON "formalization_signature_provider_resources" USING btree ("provider_envelope_id");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_provider_resources_external_uq" ON "formalization_signature_provider_resources" USING btree ("provider_external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_provider_resources_idempotency_uq" ON "formalization_signature_provider_resources" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "fs_sig_prr_recipient_uq" ON "formalization_signature_provider_recipient_resources" USING btree ("recipient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_provider_recipient_resources_provider_id_uq" ON "formalization_signature_provider_recipient_resources" USING btree ("provider_recipient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_provider_recipient_resources_pair_uq" ON "formalization_signature_provider_recipient_resources" USING btree ("provider_resource_id","provider_recipient_id");--> statement-breakpoint
CREATE INDEX "formalization_signature_provider_recipient_resources_recipient_idx" ON "formalization_signature_provider_recipient_resources" USING btree ("recipient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fs_sig_pdr_request_document_uq" ON "formalization_signature_provider_document_resources" USING btree ("request_document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fs_sig_pdr_envelope_item_uq" ON "formalization_signature_provider_document_resources" USING btree ("provider_envelope_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fs_sig_pdr_resource_item_uq" ON "formalization_signature_provider_document_resources" USING btree ("provider_resource_id","provider_envelope_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fs_sig_prov_attempt_request_uq" ON "formalization_signature_provisioning_attempts" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "formalization_signature_provisioning_attempts_work_idx" ON "formalization_signature_provisioning_attempts" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "formalization_signature_provisioning_attempts_lease_idx" ON "formalization_signature_provisioning_attempts" USING btree ("lease_expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "fs_sig_cancel_attempt_request_uq" ON "formalization_signature_cancellation_attempts" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "formalization_signature_cancellation_attempts_work_idx" ON "formalization_signature_cancellation_attempts" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "formalization_signature_cancellation_attempts_lease_idx" ON "formalization_signature_cancellation_attempts" USING btree ("lease_expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_otp_challenges_invitation_generation_uq" ON "formalization_signature_otp_challenges" USING btree ("invitation_id","generation");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_otp_challenges_current_invitation_uq" ON "formalization_signature_otp_challenges" USING btree ("invitation_id") WHERE "formalization_signature_otp_challenges"."status" in ('pending_delivery','active');--> statement-breakpoint
CREATE INDEX "formalization_signature_otp_challenges_invitation_status_idx" ON "formalization_signature_otp_challenges" USING btree ("invitation_id","status");--> statement-breakpoint
CREATE INDEX "formalization_signature_otp_send_attempts_work_idx" ON "formalization_signature_otp_send_attempts" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "formalization_signature_otp_rate_reservations_invitation_idx" ON "formalization_signature_otp_rate_reservations" USING btree ("invitation_id","reserved_at");--> statement-breakpoint
CREATE INDEX "formalization_signature_otp_rate_reservations_source_ip_idx" ON "formalization_signature_otp_rate_reservations" USING btree ("source_ip_hash","reserved_at");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_gateway_sessions_token_hash_uq" ON "formalization_signature_gateway_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_gateway_sessions_active_device_uq" ON "formalization_signature_gateway_sessions" USING btree ("recipient_id","device_secret_hash") WHERE "formalization_signature_gateway_sessions"."status" = 'active' and "formalization_signature_gateway_sessions"."kind" = 'authenticated';--> statement-breakpoint
CREATE INDEX "formalization_signature_gateway_sessions_recipient_status_idx" ON "formalization_signature_gateway_sessions" USING btree ("recipient_id","status");--> statement-breakpoint
CREATE INDEX "formalization_signature_gateway_sessions_expiry_idx" ON "formalization_signature_gateway_sessions" USING btree ("expires_at","status");--> statement-breakpoint
CREATE UNIQUE INDEX "fs_sig_ack_recipient_document_snapshot_uq" ON "formalization_signature_document_acknowledgements" USING btree ("recipient_id","request_document_id","snapshot_id");--> statement-breakpoint
CREATE INDEX "fs_sig_ack_recipient_snapshot_idx" ON "formalization_signature_document_acknowledgements" USING btree ("recipient_id","snapshot_id");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_proxy_bindings_alias_hash_uq" ON "formalization_signature_proxy_bindings" USING btree ("alias_hash");--> statement-breakpoint
CREATE INDEX "formalization_signature_proxy_bindings_recipient_status_idx" ON "formalization_signature_proxy_bindings" USING btree ("recipient_id","status");--> statement-breakpoint
CREATE INDEX "formalization_signature_proxy_bindings_expiry_idx" ON "formalization_signature_proxy_bindings" USING btree ("expires_at","status");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_webhook_receipts_dedupe_uq" ON "formalization_signature_webhook_receipts" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "formalization_signature_webhook_receipts_work_idx" ON "formalization_signature_webhook_receipts" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "formalization_signature_webhook_receipts_lease_idx" ON "formalization_signature_webhook_receipts" USING btree ("lease_until");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_artifacts_document_kind_uq" ON "formalization_signature_artifacts" USING btree ("request_document_id","kind") WHERE "formalization_signature_artifacts"."request_document_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_artifacts_request_kind_uq" ON "formalization_signature_artifacts" USING btree ("request_id","kind") WHERE "formalization_signature_artifacts"."request_document_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_protocols_number_uq" ON "formalization_signature_protocols" USING btree ("number");--> statement-breakpoint
CREATE UNIQUE INDEX "formalization_signature_protocols_recipient_request_uq" ON "formalization_signature_protocols" USING btree ("recipient_id","request_id");--> statement-breakpoint
CREATE INDEX "formalization_signature_audit_entries_request_idx" ON "formalization_signature_audit_entries" USING btree ("request_id","occurred_at");--> statement-breakpoint
CREATE INDEX "formalization_signature_audit_entries_recipient_idx" ON "formalization_signature_audit_entries" USING btree ("recipient_id","occurred_at");--> statement-breakpoint
CREATE INDEX "formalization_signature_audit_entries_correlation_idx" ON "formalization_signature_audit_entries" USING btree ("correlation_id");--> statement-breakpoint
ALTER TABLE "formalization_signature_previews" ADD CONSTRAINT "fs_sig_preview_formalization_fk" FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_previews" ADD CONSTRAINT "fs_sig_preview_file_fk" FOREIGN KEY ("file_id") REFERENCES "public"."stored_files"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_fields" ADD CONSTRAINT "fs_sig_field_formalization_fk" FOREIGN KEY ("formalization_id") REFERENCES "public"."formalizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_fields" ADD CONSTRAINT "fs_sig_field_signatory_doc_fk" FOREIGN KEY ("signatory_document_id") REFERENCES "public"."formalization_signatory_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formalization_signature_fields" ADD CONSTRAINT "fs_sig_field_preview_fk" FOREIGN KEY ("preview_id") REFERENCES "public"."formalization_signature_previews"("id") ON DELETE cascade ON UPDATE no action;