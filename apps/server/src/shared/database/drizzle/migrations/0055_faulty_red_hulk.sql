ALTER TABLE "appointment_changes" ADD COLUMN "previous_schedule_id" uuid;--> statement-breakpoint
ALTER TABLE "appointment_changes" ADD COLUMN "new_schedule_id" uuid;--> statement-breakpoint
ALTER TABLE "appointment_changes" ADD CONSTRAINT "appointment_changes_previous_schedule_id_schedules_id_fk" FOREIGN KEY ("previous_schedule_id") REFERENCES "public"."schedules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_changes" ADD CONSTRAINT "appointment_changes_new_schedule_id_schedules_id_fk" FOREIGN KEY ("new_schedule_id") REFERENCES "public"."schedules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_changes" ADD CONSTRAINT "appointment_changes_schedule_pair_check" CHECK (("appointment_changes"."previous_schedule_id" is null) = ("appointment_changes"."new_schedule_id" is null));
