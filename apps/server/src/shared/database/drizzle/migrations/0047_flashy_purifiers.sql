ALTER TYPE "public"."document_status" ADD VALUE 'processing' BEFORE 'awaiting_validation';--> statement-breakpoint
CREATE TABLE "document_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"case_id" uuid NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"justification" text NOT NULL,
	"deadline_date" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"reviewed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_exceptions_type_check" CHECK ("document_exceptions"."type" in ('DISPENSA_DEFINITIVA', 'ACEITE_PROVISORIO')),
	CONSTRAINT "document_exceptions_status_check" CHECK ("document_exceptions"."status" in ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'))
);
--> statement-breakpoint
CREATE TABLE "document_exception_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_exception_id" uuid NOT NULL,
	"action" text NOT NULL,
	"user_id" uuid NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_exception_audit_logs" ADD CONSTRAINT "document_exception_audit_logs_document_exception_id_document_exceptions_id_fk" FOREIGN KEY ("document_exception_id") REFERENCES "public"."document_exceptions"("id") ON DELETE cascade ON UPDATE no action;