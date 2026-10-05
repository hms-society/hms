CREATE TYPE "public"."third_party_permission" AS ENUM('view_intake_status', 'view_case_status');--> statement-breakpoint
CREATE TABLE "third_party_permission_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"third_party_id" uuid NOT NULL,
	"permission" "third_party_permission" NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"granted_by" uuid NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "third_party_permission_grants" ADD CONSTRAINT "third_party_permission_grants_third_party_id_third_parties_id_fk" FOREIGN KEY ("third_party_id") REFERENCES "public"."third_parties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "third_party_permission_grants" ADD CONSTRAINT "third_party_permission_grants_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "third_party_permission_grants_party_permission_uidx" ON "third_party_permission_grants" USING btree ("third_party_id","permission");--> statement-breakpoint
CREATE INDEX "third_party_permission_grants_party_active_idx" ON "third_party_permission_grants" USING btree ("third_party_id","active");