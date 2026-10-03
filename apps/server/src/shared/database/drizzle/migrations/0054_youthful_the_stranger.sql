CREATE TABLE "ai_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"suggestion_type" text NOT NULL,
	"content" text NOT NULL,
	"adjusted_content" text,
	"rejection_reason" text,
	"confidence" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"metadata" jsonb,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"suggested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_errors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"suggestion_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	"suggestion_type" text NOT NULL,
	"suggested_content" text NOT NULL,
	"rejection_reason" text NOT NULL,
	"created_by_collaborator_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"suggestion_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	"suggestion_type" text NOT NULL,
	"blocked_by_collaborator_id" uuid NOT NULL,
	"is_unblocked" boolean DEFAULT false NOT NULL,
	"blocked_at" timestamp with time zone DEFAULT now() NOT NULL
);
