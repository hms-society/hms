CREATE TYPE "public"."case_portal_access_grant_status" AS ENUM('active', 'revoked');--> statement-breakpoint
CREATE TABLE "case_portal_access_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"can_view" boolean DEFAULT false NOT NULL,
	"can_upload" boolean DEFAULT false NOT NULL,
	"status" "case_portal_access_grant_status" DEFAULT 'active' NOT NULL,
	"expires_at" timestamp with time zone,
	"granted_by" uuid NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "case_portal_access_grants" ADD CONSTRAINT "case_portal_access_grants_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_portal_access_grants" ADD CONSTRAINT "case_portal_access_grants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "case_portal_access_grants_case_user_uidx" ON "case_portal_access_grants" USING btree ("case_id","user_id");--> statement-breakpoint
CREATE INDEX "case_portal_access_grants_user_status_idx" ON "case_portal_access_grants" USING btree ("user_id","status");