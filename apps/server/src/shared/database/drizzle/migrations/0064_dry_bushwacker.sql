DO $$
DECLARE
  cases_without_manager text;
BEGIN
  SELECT string_agg(invalid.case_id::text, ', ' ORDER BY invalid.case_id::text)
  INTO cases_without_manager
  FROM (
    SELECT cases.id AS case_id
    FROM cases
    WHERE NOT EXISTS (
      SELECT 1
      FROM case_members AS member
      JOIN collaborators AS collaborator ON collaborator.id = member.collaborator_id
      JOIN users AS user_record ON user_record.id = collaborator.user_id
      WHERE member.case_id = cases.id
        AND (member.role::text = 'lead_lawyer' OR member.is_primary = true)
        AND user_record.status::text = 'active'
        AND collaborator.profile::text IN ('lawyer', 'paralegal', 'supervisor')
    )
  ) AS invalid;

  IF cases_without_manager IS NOT NULL THEN
    RAISE EXCEPTION 'Case team migration requires explicit manager corrections for cases: %', cases_without_manager;
  END IF;
END $$;
--> statement-breakpoint
CREATE TYPE "public"."case_team_history_kind" AS ENUM('added', 'removed', 'role_changed', 'eligibility_changed', 'legacy_imported');--> statement-breakpoint
CREATE TABLE "case_team_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"collaborator_id" uuid NOT NULL,
	"actor_id" uuid,
	"kind" "case_team_history_kind" NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"team_version" integer NOT NULL,
	"previous_role" text,
	"next_role" text,
	"previous_eligibility" jsonb,
	"next_eligibility" jsonb,
	"reason" text,
	"operation_id" uuid,
	"legacy" jsonb
);
--> statement-breakpoint
CREATE TABLE "case_team_operations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"operation_id" uuid NOT NULL,
	"fingerprint" text NOT NULL,
	"result" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TYPE "public"."case_member_role_new" AS ENUM('manager', 'collaborator');--> statement-breakpoint
ALTER TABLE "case_members" ADD COLUMN "role_new" "public"."case_member_role_new";--> statement-breakpoint
DROP INDEX "case_members_one_primary_per_case_uidx";--> statement-breakpoint
ALTER TABLE "case_members" ADD COLUMN "removed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "case_members" ADD COLUMN "removed_by" uuid;--> statement-breakpoint
ALTER TABLE "case_members" ADD COLUMN "archived_legacy" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "team_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE "case_members" AS member
SET
  "role_new" = CASE
    WHEN (member."role"::text = 'lead_lawyer' OR member."is_primary" = true)
      AND user_record."status"::text = 'active'
      AND collaborator."profile"::text IN ('lawyer', 'paralegal', 'supervisor')
    THEN 'manager'::"public"."case_member_role_new"
    ELSE 'collaborator'::"public"."case_member_role_new"
  END,
  "archived_legacy" = NOT (
    user_record."status"::text = 'active'
    AND collaborator."profile"::text IN ('lawyer', 'paralegal', 'supervisor')
  )
FROM "collaborators" AS collaborator
JOIN "users" AS user_record ON user_record."id" = collaborator."user_id"
WHERE collaborator."id" = member."collaborator_id";--> statement-breakpoint
UPDATE "case_members" AS member
SET "archived_legacy" = true
WHERE NOT EXISTS (
  SELECT 1 FROM "collaborators" AS collaborator
  JOIN "users" AS user_record ON user_record."id" = collaborator."user_id"
  WHERE collaborator."id" = member."collaborator_id"
);--> statement-breakpoint
UPDATE "case_members"
SET "role_new" = CASE
  WHEN "role"::text = 'lead_lawyer' OR "is_primary" = true
  THEN 'manager'::"public"."case_member_role_new"
  ELSE 'collaborator'::"public"."case_member_role_new"
END
WHERE "role_new" IS NULL;--> statement-breakpoint
INSERT INTO "case_team_history" (
  "case_id", "membership_id", "collaborator_id", "actor_id", "kind", "occurred_at",
  "team_version", "next_role", "next_eligibility", "legacy"
)
SELECT
  member."case_id",
  member."id",
  member."collaborator_id",
  NULL,
  'legacy_imported',
  member."assigned_at",
  cases."team_version",
  member."role_new"::text,
  CASE WHEN collaborator."id" IS NOT NULL THEN jsonb_build_object(
    'profile', collaborator."profile"::text,
    'status', user_record."status"::text
  ) ELSE NULL END,
  jsonb_build_object(
    'role', member."role"::text,
    'permission', member."permission",
    'isPrimary', member."is_primary",
    'assignedAt', member."assigned_at",
    'assignedBy', member."assigned_by",
    'createdAt', member."created_at"
  )
FROM "case_members" AS member
JOIN "cases" AS cases ON cases."id" = member."case_id"
LEFT JOIN "collaborators" AS collaborator ON collaborator."id" = member."collaborator_id"
LEFT JOIN "users" AS user_record ON user_record."id" = collaborator."user_id";--> statement-breakpoint
ALTER TABLE "case_members" DROP COLUMN "role";--> statement-breakpoint
ALTER TABLE "case_members" DROP COLUMN "permission";--> statement-breakpoint
ALTER TABLE "case_members" DROP COLUMN "is_primary";--> statement-breakpoint
ALTER TABLE "case_members" DROP COLUMN "role_new";--> statement-breakpoint
ALTER TABLE "case_members" ADD COLUMN "role" "public"."case_member_role_new" NOT NULL DEFAULT 'collaborator';--> statement-breakpoint
UPDATE "case_members" AS member
SET "role" = history."next_role"::"public"."case_member_role_new"
FROM "case_team_history" AS history
WHERE history."membership_id" = member."id" AND history."kind" = 'legacy_imported';--> statement-breakpoint
DROP TYPE "public"."case_member_role";--> statement-breakpoint
ALTER TYPE "public"."case_member_role_new" RENAME TO "case_member_role";--> statement-breakpoint
ALTER TABLE "case_members" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "case_team_history" ADD CONSTRAINT "case_team_history_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_team_history" ADD CONSTRAINT "case_team_history_membership_id_case_members_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."case_members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_team_operations" ADD CONSTRAINT "case_team_operations_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "case_team_history_case_occurred_id_idx" ON "case_team_history" USING btree ("case_id","occurred_at","id");--> statement-breakpoint
CREATE UNIQUE INDEX "case_team_history_operation_uidx" ON "case_team_history" USING btree ("case_id","operation_id","membership_id","kind") WHERE "case_team_history"."operation_id" IS NOT NULL AND "case_team_history"."kind" <> 'legacy_imported';--> statement-breakpoint
CREATE UNIQUE INDEX "case_team_history_legacy_membership_uidx" ON "case_team_history" USING btree ("membership_id") WHERE "case_team_history"."kind" = 'legacy_imported';--> statement-breakpoint
CREATE UNIQUE INDEX "case_team_operations_key_uidx" ON "case_team_operations" USING btree ("case_id","actor_id","operation_id");--> statement-breakpoint
CREATE INDEX "case_members_active_case_id_idx" ON "case_members" USING btree ("case_id") WHERE "case_members"."removed_at" IS NULL AND "case_members"."archived_legacy" = false;
