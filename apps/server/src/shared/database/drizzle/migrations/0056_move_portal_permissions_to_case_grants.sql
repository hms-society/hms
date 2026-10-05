ALTER TABLE "case_portal_access_grants" ADD COLUMN "can_view_case_status" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "case_portal_access_grants" ADD COLUMN "can_view_intake_status" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "case_portal_access_grants" AS grants
SET
  "can_view_case_status" = EXISTS (
    SELECT 1
    FROM "third_party_permission_grants" AS permissions
    WHERE permissions."third_party_id" = grants."third_party_id"
      AND permissions."permission" = 'view_case_status'
      AND permissions."active" = true
  ),
  "can_view_intake_status" = EXISTS (
    SELECT 1
    FROM "third_party_permission_grants" AS permissions
    WHERE permissions."third_party_id" = grants."third_party_id"
      AND permissions."permission" = 'view_intake_status'
      AND permissions."active" = true
  )
WHERE grants."third_party_id" IS NOT NULL;--> statement-breakpoint
DROP TABLE "third_party_permission_grants";--> statement-breakpoint
DROP TYPE "third_party_permission";