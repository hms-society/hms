CREATE TYPE "public"."case_member_role" AS ENUM('lead_lawyer', 'lawyer', 'paralegal', 'supervisor');--> statement-breakpoint
CREATE TYPE "public"."legal_case_status" AS ENUM('documentation', 'legal_production', 'protocol_delivery', 'execution', 'closed');--> statement-breakpoint
CREATE TABLE "cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_code" text NOT NULL,
	"client_id" uuid NOT NULL,
	"intake_id" uuid NOT NULL,
	"legal_area_id" uuid NOT NULL,
	"legal_topic_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" "legal_case_status" DEFAULT 'documentation' NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cases_version_positive_check" CHECK ("cases"."version" > 0),
	CONSTRAINT "cases_public_code_format_check" CHECK ("cases"."public_code" ~ '^CASO-[0-9]{8}-[0-9]{4}$'),
	CONSTRAINT "cases_public_code_not_blank_check" CHECK (char_length(btrim("cases"."public_code")) > 0),
	CONSTRAINT "cases_title_not_blank_check" CHECK (char_length(btrim("cases"."title")) > 0),
	CONSTRAINT "cases_updated_after_created_check" CHECK ("cases"."updated_at" >= "cases"."created_at")
);
--> statement-breakpoint
CREATE TABLE "case_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"collaborator_id" uuid NOT NULL,
	"role" "case_member_role" NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"assigned_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "case_members" ADD CONSTRAINT "case_members_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cases_public_code_uidx" ON "cases" USING btree ("public_code");--> statement-breakpoint
CREATE UNIQUE INDEX "cases_intake_id_uidx" ON "cases" USING btree ("intake_id");--> statement-breakpoint
CREATE INDEX "cases_client_status_idx" ON "cases" USING btree ("client_id","status");--> statement-breakpoint
CREATE INDEX "cases_opened_at_idx" ON "cases" USING btree ("opened_at");--> statement-breakpoint
CREATE UNIQUE INDEX "case_members_case_collaborator_uidx" ON "case_members" USING btree ("case_id","collaborator_id");--> statement-breakpoint
CREATE INDEX "case_members_case_id_idx" ON "case_members" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "case_members_collaborator_id_idx" ON "case_members" USING btree ("collaborator_id");--> statement-breakpoint
CREATE UNIQUE INDEX "case_members_one_primary_per_case_uidx" ON "case_members" USING btree ("case_id") WHERE "case_members"."is_primary" = true;
