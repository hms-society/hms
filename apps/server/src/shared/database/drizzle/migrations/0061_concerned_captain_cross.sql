CREATE TYPE "public"."case_task_source" AS ENUM('manual', 'automation', 'import');--> statement-breakpoint
CREATE TYPE "public"."case_task_status" AS ENUM('to_do', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."case_task_type" AS ENUM('process_deadline', 'hearing', 'publication', 'internal_task', 'delivery', 'other');--> statement-breakpoint
CREATE TABLE "case_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"type" "case_task_type" NOT NULL,
	"custom_type" text,
	"description" text NOT NULL,
	"planned_date" date NOT NULL,
	"planned_time" time(0),
	"status" "case_task_status" DEFAULT 'to_do' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"completed_by_id" uuid,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"source" "case_task_source" DEFAULT 'manual' NOT NULL,
	"completion_note" text,
	"last_reminder_at" timestamp with time zone,
	CONSTRAINT "case_tasks_description_not_blank_check" CHECK (char_length(btrim("case_tasks"."description")) > 0),
	CONSTRAINT "case_tasks_custom_type_check" CHECK ("case_tasks"."type" <> 'other' OR ("case_tasks"."custom_type" IS NOT NULL AND char_length(btrim("case_tasks"."custom_type")) > 0)),
	CONSTRAINT "case_tasks_version_check" CHECK ("case_tasks"."version" > 0),
	CONSTRAINT "case_tasks_updated_after_created_check" CHECK ("case_tasks"."updated_at" >= "case_tasks"."created_at")
);
--> statement-breakpoint
CREATE TABLE "case_task_assignees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_task_id" uuid NOT NULL,
	"collaborator_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_task_reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_task_id" uuid NOT NULL,
	"days_before" integer NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "case_task_reminders_days_before_check" CHECK ("case_task_reminders"."days_before" > 0)
);
--> statement-breakpoint
ALTER TABLE "case_tasks" ADD CONSTRAINT "case_tasks_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_task_assignees" ADD CONSTRAINT "case_task_assignees_case_task_id_case_tasks_id_fk" FOREIGN KEY ("case_task_id") REFERENCES "public"."case_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_task_reminders" ADD CONSTRAINT "case_task_reminders_case_task_id_case_tasks_id_fk" FOREIGN KEY ("case_task_id") REFERENCES "public"."case_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "case_tasks_case_id_idx" ON "case_tasks" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "case_tasks_case_planned_date_idx" ON "case_tasks" USING btree ("case_id","planned_date");--> statement-breakpoint
CREATE INDEX "case_tasks_deleted_at_idx" ON "case_tasks" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "case_task_assignees_task_collaborator_uidx" ON "case_task_assignees" USING btree ("case_task_id","collaborator_id");--> statement-breakpoint
CREATE INDEX "case_task_assignees_task_id_idx" ON "case_task_assignees" USING btree ("case_task_id");--> statement-breakpoint
CREATE INDEX "case_task_assignees_collaborator_id_idx" ON "case_task_assignees" USING btree ("collaborator_id");--> statement-breakpoint
CREATE UNIQUE INDEX "case_task_reminders_task_days_before_uidx" ON "case_task_reminders" USING btree ("case_task_id","days_before");--> statement-breakpoint
CREATE INDEX "case_task_reminders_task_id_idx" ON "case_task_reminders" USING btree ("case_task_id");