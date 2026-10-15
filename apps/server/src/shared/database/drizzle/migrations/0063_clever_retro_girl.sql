ALTER TABLE "case_task_reminders" RENAME COLUMN "days_before" TO "value";--> statement-breakpoint
ALTER TABLE "case_task_reminders" DROP CONSTRAINT "case_task_reminders_days_before_check";--> statement-breakpoint
DROP INDEX "case_task_reminders_task_days_before_uidx";--> statement-breakpoint
ALTER TABLE "case_task_reminders" ADD COLUMN "unit" text DEFAULT 'days' NOT NULL;--> statement-breakpoint
ALTER TABLE "case_task_reminders" ALTER COLUMN "unit" DROP DEFAULT;--> statement-breakpoint
CREATE UNIQUE INDEX "case_task_reminders_task_days_before_uidx" ON "case_task_reminders" USING btree ("case_task_id","value","unit");--> statement-breakpoint
ALTER TABLE "case_task_reminders" ADD CONSTRAINT "case_task_reminders_value_check" CHECK ("case_task_reminders"."value" > 0);
