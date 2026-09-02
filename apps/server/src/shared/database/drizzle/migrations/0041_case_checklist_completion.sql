ALTER TABLE "cases" ADD COLUMN "checklist_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "checklist_completed_by" uuid;
