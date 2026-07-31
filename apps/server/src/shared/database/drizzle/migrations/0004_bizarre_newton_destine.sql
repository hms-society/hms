CREATE TYPE "public"."user_status" AS ENUM('invited', 'active', 'disabled');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" "user_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "technical_profile_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "position_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "active";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "temporary_permission";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "permission_expires_at";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "permission_justification";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "permission_approver_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "scope";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "created_by";