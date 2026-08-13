CREATE TYPE "public"."document_batch_status" AS ENUM('received', 'pending_identification', 'identified', 'automatic_triage_in_progress', 'triage_completed', 'pending_human_review', 'processed', 'with_error');--> statement-breakpoint
CREATE TYPE "public"."document_channel" AS ENUM('whatsapp', 'client_portal', 'third_party_portal', 'internal_upload');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('awaiting_validation', 'validated', 'illegible', 'incomplete', 'duplicate', 'processing_failure');--> statement-breakpoint
ALTER TYPE "public"."collaborator_profile" ADD VALUE 'client';--> statement-breakpoint
CREATE TABLE "document_specification_legal_areas" (
	"document_specification_id" uuid NOT NULL,
	"legal_area_id" uuid NOT NULL,
	CONSTRAINT "document_specification_legal_areas_pk" PRIMARY KEY("document_specification_id","legal_area_id")
);
--> statement-breakpoint
CREATE TABLE "document_specification_legal_topics" (
	"document_specification_id" uuid NOT NULL,
	"legal_area_id" uuid NOT NULL,
	"legal_topic_id" uuid NOT NULL,
	CONSTRAINT "document_specification_legal_topics_pk" PRIMARY KEY("document_specification_id","legal_area_id","legal_topic_id")
);
--> statement-breakpoint
CREATE TABLE "document_specifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"content" jsonb NOT NULL,
	"variables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"moment" text NOT NULL,
	"scope" text NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_specifications_moment_check" CHECK ("document_specifications"."moment" in ('consultation', 'formalization', 'legal_production')),
	CONSTRAINT "document_specifications_scope_check" CHECK ("document_specifications"."scope" in ('global', 'legal_context')),
	CONSTRAINT "document_specifications_status_check" CHECK ("document_specifications"."status" in ('available', 'unavailable')),
	CONSTRAINT "document_specifications_variables_check" CHECK (jsonb_typeof("document_specifications"."variables") = 'array'),
	CONSTRAINT "document_specifications_content_check" CHECK (jsonb_typeof("document_specifications"."content") = 'object' AND "document_specifications"."content"->>'type' = 'doc' AND ("document_specifications"."content"->'content' IS NULL OR jsonb_typeof("document_specifications"."content"->'content') = 'array'))
);
--> statement-breakpoint
CREATE TABLE "private_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"collaborator_id" uuid NOT NULL,
	"intake_id" uuid NOT NULL,
	"client_phone" text,
	"direction" "communication_direction" NOT NULL,
	"content" text,
	"file_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_counters" (
	"context" varchar(50) NOT NULL,
	"date" date NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "daily_counters_context_date_pk" PRIMARY KEY("context","date")
);
--> statement-breakpoint
CREATE TABLE "document_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"readable_id" text NOT NULL,
	"status" "document_batch_status" DEFAULT 'received' NOT NULL,
	"channel" "document_channel" NOT NULL,
	"sender" text NOT NULL,
	"in_triage_box" boolean DEFAULT false NOT NULL,
	"client_id" uuid,
	"intake_id" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_batches_readable_id_unique" UNIQUE("readable_id")
);
--> statement-breakpoint
CREATE TABLE "document_batch_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"hash_sha256" text,
	"status" "document_status",
	"case_id" uuid,
	"checklist_item_id" uuid,
	"ai_confidence" integer,
	"extracted_fields" jsonb,
	"missing_fields" jsonb,
	"is_duplicate" boolean DEFAULT false NOT NULL,
	"original_document_id" uuid,
	"ai_suggestion" jsonb,
	"human_correction" jsonb,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_specification_legal_areas" ADD CONSTRAINT "document_specification_legal_areas_document_specification_id_document_specifications_id_fk" FOREIGN KEY ("document_specification_id") REFERENCES "public"."document_specifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_specification_legal_topics" ADD CONSTRAINT "document_specification_legal_topics_area_fk" FOREIGN KEY ("document_specification_id","legal_area_id") REFERENCES "public"."document_specification_legal_areas"("document_specification_id","legal_area_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_messages" ADD CONSTRAINT "private_messages_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_batches" ADD CONSTRAINT "document_batches_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_batches" ADD CONSTRAINT "document_batches_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_batches" ADD CONSTRAINT "document_batches_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_batch_files" ADD CONSTRAINT "document_batch_files_batch_id_document_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."document_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_batch_files" ADD CONSTRAINT "document_batch_files_original_document_id_document_batch_files_id_fk" FOREIGN KEY ("original_document_id") REFERENCES "public"."document_batch_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_batch_files" ADD CONSTRAINT "document_batch_files_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "document_specification_legal_areas_area_idx" ON "document_specification_legal_areas" USING btree ("legal_area_id");--> statement-breakpoint
CREATE INDEX "document_specification_legal_topics_topic_idx" ON "document_specification_legal_topics" USING btree ("legal_topic_id");--> statement-breakpoint
CREATE INDEX "document_specifications_name_normalized_idx" ON "document_specifications" USING btree (lower(trim("name")));--> statement-breakpoint
CREATE INDEX "document_specifications_moment_idx" ON "document_specifications" USING btree ("moment");--> statement-breakpoint
CREATE INDEX "document_specifications_status_idx" ON "document_specifications" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "document_batches_readable_id_uidx" ON "document_batches" USING btree ("readable_id");--> statement-breakpoint
CREATE INDEX "document_batches_status_idx" ON "document_batches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "document_batches_client_id_idx" ON "document_batches" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "document_batches_in_triage_box_idx" ON "document_batches" USING btree ("in_triage_box");