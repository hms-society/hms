CREATE TYPE "public"."case_closure_event_type" AS ENUM('closed', 'reopened');--> statement-breakpoint
CREATE TYPE "public"."case_closure_outcome" AS ENUM('favorable', 'partially_favorable', 'unfavorable', 'agreement', 'product_delivered', 'withdrawal', 'mootness', 'other');--> statement-breakpoint
CREATE TYPE "public"."legal_case_lifecycle_status" AS ENUM('active', 'closed');--> statement-breakpoint
CREATE TABLE "case_closure_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"type" "case_closure_event_type" NOT NULL,
	"actor_id" uuid NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"outcome" "case_closure_outcome",
	"notes" text,
	"reason" text,
	CONSTRAINT "case_closure_events_payload_check" CHECK (("case_closure_events"."type" = 'closed' AND "case_closure_events"."outcome" IS NOT NULL AND "case_closure_events"."reason" IS NULL) OR ("case_closure_events"."type" = 'reopened' AND "case_closure_events"."outcome" IS NULL AND "case_closure_events"."notes" IS NULL AND "case_closure_events"."reason" IS NOT NULL AND char_length(btrim("case_closure_events"."reason")) > 0))
);
--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "lifecycle_status" "legal_case_lifecycle_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "workflow_stage" "legal_case_status";--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "closure_outcome" "case_closure_outcome";--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "closure_notes" text;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "closed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "closed_by" uuid;--> statement-breakpoint
ALTER TABLE "case_closure_events" ADD CONSTRAINT "case_closure_events_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "case_closure_events_case_occurred_idx" ON "case_closure_events" USING btree ("case_id","occurred_at","id");
--> statement-breakpoint
UPDATE "cases"
SET
	"workflow_stage" = CASE
		WHEN "status" = 'closed' THEN NULL
		ELSE "status"
	END,
	"lifecycle_status" = CASE
		WHEN "status" = 'closed' THEN 'closed'::"legal_case_lifecycle_status"
		ELSE 'active'::"legal_case_lifecycle_status"
	END;
--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_workflow_stage_matches_legacy_status_check"
	CHECK ("workflow_stage" IS NULL OR ("workflow_stage" = "status" AND "workflow_stage" <> 'closed'));
--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_closure_fields_all_or_none_check"
	CHECK (("closure_outcome" IS NULL AND "closed_at" IS NULL AND "closed_by" IS NULL) OR ("closure_outcome" IS NOT NULL AND "closed_at" IS NOT NULL AND "closed_by" IS NOT NULL));
--> statement-breakpoint
CREATE FUNCTION "reject_case_closure_event_mutation"() RETURNS trigger AS $$
BEGIN
	RAISE EXCEPTION 'Case closure events are append-only.' USING ERRCODE = '55000';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER "case_closure_events_no_update"
	BEFORE UPDATE ON "case_closure_events"
	FOR EACH ROW EXECUTE FUNCTION "reject_case_closure_event_mutation"();
--> statement-breakpoint
CREATE TRIGGER "case_closure_events_no_delete"
	BEFORE DELETE ON "case_closure_events"
	FOR EACH ROW EXECUTE FUNCTION "reject_case_closure_event_mutation"();
