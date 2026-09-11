ALTER TYPE "public"."case_member_role" ADD VALUE IF NOT EXISTS 'intern';--> statement-breakpoint
ALTER TYPE "public"."collaborator_profile" ADD VALUE IF NOT EXISTS 'intern';--> statement-breakpoint
ALTER TABLE "case_members" ADD COLUMN IF NOT EXISTS "permission" varchar(50) DEFAULT 'visualização' NOT NULL;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN IF NOT EXISTS "description" text;
