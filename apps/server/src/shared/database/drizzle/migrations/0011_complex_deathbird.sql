CREATE TYPE "public"."document_status" AS ENUM('awaiting_validation', 'validated', 'illegible', 'incomplete', 'duplicate', 'processing_failure');--> statement-breakpoint
ALTER TABLE "document_batch_files" ADD COLUMN "hash_sha256" text;--> statement-breakpoint
ALTER TABLE "document_batch_files" ADD COLUMN "status" "document_status";--> statement-breakpoint
ALTER TABLE "document_batch_files" ADD COLUMN "case_id" uuid;--> statement-breakpoint
ALTER TABLE "document_batch_files" ADD COLUMN "checklist_item_id" uuid;--> statement-breakpoint
ALTER TABLE "document_batch_files" ADD COLUMN "ai_confidence" integer;--> statement-breakpoint
ALTER TABLE "document_batch_files" ADD COLUMN "extracted_fields" jsonb;--> statement-breakpoint
ALTER TABLE "document_batch_files" ADD COLUMN "missing_fields" jsonb;--> statement-breakpoint
ALTER TABLE "document_batch_files" ADD COLUMN "is_duplicate" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "document_batch_files" ADD COLUMN "original_document_id" uuid;--> statement-breakpoint
ALTER TABLE "document_batch_files" ADD COLUMN "ai_suggestion" jsonb;--> statement-breakpoint
ALTER TABLE "document_batch_files" ADD COLUMN "human_correction" jsonb;--> statement-breakpoint
ALTER TABLE "document_batch_files" ADD COLUMN "reviewed_by" uuid;--> statement-breakpoint
ALTER TABLE "document_batch_files" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "document_batch_files" ADD CONSTRAINT "document_batch_files_original_document_id_document_batch_files_id_fk" FOREIGN KEY ("original_document_id") REFERENCES "public"."document_batch_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_batch_files" ADD CONSTRAINT "document_batch_files_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;