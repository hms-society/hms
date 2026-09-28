ALTER TABLE "consultation_outbox_events" RENAME CONSTRAINT "consultation_outbox_events_name_check" TO "consultation_outbox_name_check";--> statement-breakpoint
ALTER TABLE "consultation_outbox_events" RENAME CONSTRAINT "consultation_outbox_events_consultation_id_consultations_id_fk" TO "consultation_outbox_consultation_fk";--> statement-breakpoint
ALTER TABLE "consultation_outbox_events" ADD CONSTRAINT "consultation_outbox_payload_check" CHECK (jsonb_typeof("payload") = 'object');--> statement-breakpoint
ALTER INDEX "consultation_outbox_events_pending_idx" RENAME TO "consultation_outbox_pending_idx";--> statement-breakpoint
CREATE INDEX "consultation_outbox_consultation_occurrence_idx" ON "consultation_outbox_events" USING btree ("consultation_id","occurred_at","id");
