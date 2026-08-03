CREATE TYPE "public"."document_batch_status" AS ENUM('received', 'pending_identification', 'identified', 'automatic_triage_in_progress', 'triage_completed', 'pending_human_review', 'processed', 'with_error');--> statement-breakpoint
CREATE TYPE "public"."document_channel" AS ENUM('whatsapp', 'client_portal', 'third_party_portal', 'internal_upload');--> statement-breakpoint
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
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_batches" ADD CONSTRAINT "document_batches_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_batches" ADD CONSTRAINT "document_batches_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_batches" ADD CONSTRAINT "document_batches_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_batch_files" ADD CONSTRAINT "document_batch_files_batch_id_document_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."document_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "document_batches_readable_id_uidx" ON "document_batches" USING btree ("readable_id");--> statement-breakpoint
CREATE INDEX "document_batches_status_idx" ON "document_batches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "document_batches_client_id_idx" ON "document_batches" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "document_batches_in_triage_box_idx" ON "document_batches" USING btree ("in_triage_box");