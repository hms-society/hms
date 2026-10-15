ALTER TABLE "document_version_homologations" ADD COLUMN "artifact_file_id" uuid;--> statement-breakpoint
ALTER TABLE "document_version_homologations" ADD COLUMN "artifact_storage_path" text;--> statement-breakpoint
ALTER TABLE "document_version_homologations" ADD COLUMN "artifact_content_type" text;--> statement-breakpoint
ALTER TABLE "document_version_homologations" ADD COLUMN "artifact_created_at" timestamp with time zone;