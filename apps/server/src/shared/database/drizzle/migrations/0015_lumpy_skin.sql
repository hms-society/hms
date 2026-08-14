CREATE TABLE "document_generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"document_specification_version_id" uuid NOT NULL,
	"requested_by_collaborator_id" uuid NOT NULL,
	"source" jsonb NOT NULL,
	"status" text NOT NULL,
	"attempts_count" integer NOT NULL,
	"findings" jsonb NOT NULL,
	"document_version_id" uuid,
	"failure_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_generations_status_check" CHECK ("document_generations"."status" in ('pending', 'running', 'completed', 'failed', 'cancelled')),
	CONSTRAINT "document_generations_attempts_count_check" CHECK ("document_generations"."attempts_count" between 0 and 3),
	CONSTRAINT "document_generations_source_check" CHECK (jsonb_typeof("document_generations"."source") = 'object'),
	CONSTRAINT "document_generations_findings_check" CHECK (jsonb_typeof("document_generations"."findings") = 'array')
);
--> statement-breakpoint
CREATE INDEX "document_generations_document_id_idx" ON "document_generations" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "document_generations_status_idx" ON "document_generations" USING btree ("status");