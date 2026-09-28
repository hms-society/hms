ALTER TABLE "case_portal_access_grants" DROP CONSTRAINT "case_portal_access_grants_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "case_portal_access_grants_case_user_uidx";--> statement-breakpoint
DROP INDEX "case_portal_access_grants_user_status_idx";--> statement-breakpoint
ALTER TABLE "case_portal_access_grants" ADD COLUMN "token_hash" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "case_portal_access_grants_token_hash_uidx" ON "case_portal_access_grants" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "case_portal_access_grants_case_status_idx" ON "case_portal_access_grants" USING btree ("case_id","status");--> statement-breakpoint
ALTER TABLE "case_portal_access_grants" DROP COLUMN "user_id";