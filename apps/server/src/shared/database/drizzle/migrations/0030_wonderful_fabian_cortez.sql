CREATE TABLE "dynamic_forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text NOT NULL,
	"contexts" jsonb NOT NULL,
	"fields" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dynamic_forms_status_check" CHECK ("dynamic_forms"."status" in ('available', 'unavailable'))
);
