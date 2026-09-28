CREATE TABLE "consultation_outbox_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"consultation_id" uuid NOT NULL,
	"name" text NOT NULL,
	"payload" jsonb NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "consultation_outbox_events_name_check" CHECK ("consultation_outbox_events"."name" in ('consultation/consultation.completed', 'consultation/consultation.legal-context-updated'))
);
--> statement-breakpoint
CREATE TABLE "appointment_changes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"appointment_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"actor_id" uuid NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"previous_starts_at" timestamp with time zone NOT NULL,
	"previous_ends_at" timestamp with time zone NOT NULL,
	"new_starts_at" timestamp with time zone,
	"new_ends_at" timestamp with time zone,
	"previous_revision" timestamp with time zone NOT NULL,
	"resulting_revision" timestamp with time zone NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "appointment_changes_kind_check" CHECK ("appointment_changes"."kind" in ('cancelled', 'rescheduled')),
	CONSTRAINT "appointment_changes_period_check" CHECK (("appointment_changes"."kind" = 'cancelled' and "appointment_changes"."new_starts_at" is null and "appointment_changes"."new_ends_at" is null) or ("appointment_changes"."kind" = 'rescheduled' and "appointment_changes"."new_starts_at" is not null and "appointment_changes"."new_ends_at" is not null and "appointment_changes"."new_ends_at" > "appointment_changes"."new_starts_at")),
	CONSTRAINT "appointment_changes_revision_check" CHECK ("appointment_changes"."resulting_revision" > "appointment_changes"."previous_revision")
);
--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "time_zone" text DEFAULT 'America/Sao_Paulo' NOT NULL;--> statement-breakpoint
ALTER TABLE "consultation_outbox_events" ADD CONSTRAINT "consultation_outbox_events_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_changes" ADD CONSTRAINT "appointment_changes_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "consultation_outbox_events_pending_idx" ON "consultation_outbox_events" USING btree ("occurred_at","id") WHERE "consultation_outbox_events"."published_at" is null;--> statement-breakpoint
CREATE INDEX "appointment_changes_appointment_occurrence_idx" ON "appointment_changes" USING btree ("appointment_id","occurred_at","id");--> statement-breakpoint
CREATE INDEX "appointment_changes_pending_idx" ON "appointment_changes" USING btree ("occurred_at","id") WHERE "appointment_changes"."published_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "appointment_changes_revision_uq" ON "appointment_changes" USING btree ("appointment_id","previous_revision","kind");--> statement-breakpoint
CREATE INDEX "appointments_schedule_period_idx" ON "appointments" USING btree ("schedule_id","starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "blocked_periods_schedule_period_idx" ON "blocked_periods" USING btree ("schedule_id","start_date","end_date");--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_time_zone_nonempty_check" CHECK (length("schedules"."time_zone") > 0);
