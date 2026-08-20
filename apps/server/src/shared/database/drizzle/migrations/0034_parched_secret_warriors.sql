UPDATE "consultations" SET "status" = 'pending' WHERE "status" = 'in_progress';--> statement-breakpoint
UPDATE "consultations" SET "status" = 'pending' WHERE "status" = 'in_progress';--> statement-breakpoint
ALTER TABLE "consultations" DROP CONSTRAINT "consultations_status_check";--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_status_check" CHECK ("consultations"."status" in ('pending', 'completed', 'no_show'));
