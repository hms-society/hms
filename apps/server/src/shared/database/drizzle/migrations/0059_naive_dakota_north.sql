CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_id" uuid,
	"actor_profile" varchar(50),
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid,
	"action" varchar(100) NOT NULL,
	"origin" varchar(20) NOT NULL,
	"status" varchar(20) NOT NULL,
	"before_data" jsonb,
	"after_data" jsonb,
	"metadata" jsonb,
	"ip_address" varchar(45),
	"justification" text
);
--> statement-breakpoint
CREATE INDEX "audit_events_occurred_at_idx" ON "audit_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "audit_events_entity_type_idx" ON "audit_events" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "audit_events_entity_id_idx" ON "audit_events" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "audit_events_action_idx" ON "audit_events" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_events_origin_idx" ON "audit_events" USING btree ("origin");--> statement-breakpoint
CREATE INDEX "audit_events_status_idx" ON "audit_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "audit_events_actor_id_idx" ON "audit_events" USING btree ("actor_id");