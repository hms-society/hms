CREATE TYPE "public"."user_type" AS ENUM('internal', 'external_client', 'external_third_party', 'external_lawyer');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"email" varchar(254) NOT NULL,
	"technical_profile_id" uuid NOT NULL,
	"position_id" uuid,
	"type" "user_type" NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"temporary_permission" boolean DEFAULT false NOT NULL,
	"permission_expires_at" timestamp with time zone,
	"permission_justification" text,
	"permission_approver_id" uuid,
	"scope" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
