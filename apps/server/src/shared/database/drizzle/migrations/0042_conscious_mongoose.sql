ALTER TYPE "public"."case_member_role" ADD VALUE 'intern';--> statement-breakpoint
ALTER TYPE "public"."collaborator_profile" ADD VALUE 'intern';--> statement-breakpoint
ALTER TABLE "cases" DROP CONSTRAINT "cases_version_positive_check";--> statement-breakpoint
ALTER TABLE "case_members" ADD COLUMN "permission" varchar(50) DEFAULT 'visualização' NOT NULL;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "cases" DROP COLUMN "version";