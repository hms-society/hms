CREATE TABLE "dynamic_form_legal_topics" (
	"dynamic_form_id" uuid NOT NULL,
	"legal_topic_id" uuid NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "dynamic_form_legal_topics_dynamic_form_id_legal_topic_id_pk" PRIMARY KEY("dynamic_form_id","legal_topic_id"),
	CONSTRAINT "dynamic_form_legal_topics_position_check" CHECK ("dynamic_form_legal_topics"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "dynamic_form_administration_audit_entries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"dynamic_form_id" uuid NOT NULL,
	"actor_collaborator_id" uuid NOT NULL,
	"action" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"operation_key" uuid,
	"details" jsonb NOT NULL,
	CONSTRAINT "dynamic_form_admin_audit_action_check" CHECK ("dynamic_form_administration_audit_entries"."action" in ('duplicated', 'availability_changed', 'deleted'))
);
--> statement-breakpoint
CREATE TABLE "dynamic_form_duplicate_operations" (
	"operation_key" uuid PRIMARY KEY NOT NULL,
	"source_dynamic_form_id" uuid NOT NULL,
	"requested_normalized_name" text NOT NULL,
	"actor_collaborator_id" uuid NOT NULL,
	"result" jsonb NOT NULL,
	"completed_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dynamic_forms" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "dynamic_forms" ADD COLUMN "normalized_name" text;--> statement-breakpoint
ALTER TABLE "dynamic_forms" ADD COLUMN "stage" text;--> statement-breakpoint
ALTER TABLE "dynamic_forms" ADD COLUMN "legal_area_id" uuid;--> statement-breakpoint
UPDATE "dynamic_forms"
SET
	"normalized_name" = lower(btrim("name")),
	"stage" = CASE
		WHEN "contexts"->0->>'type' = 'formalization' THEN 'formalization'
		ELSE 'consultation'
	END,
	"legal_area_id" = ("contexts"->0->'data'->>'legalAreaId')::uuid;
--> statement-breakpoint
INSERT INTO "dynamic_form_legal_topics" ("dynamic_form_id", "legal_topic_id", "position")
SELECT
	"dynamic_forms"."id",
	(topic_id)::uuid,
	(ordinality - 1)::integer
FROM "dynamic_forms"
CROSS JOIN LATERAL jsonb_array_elements_text(
	"dynamic_forms"."contexts"->0->'data'->'legalTopicIds'
) WITH ORDINALITY AS topics(topic_id, ordinality);
--> statement-breakpoint
ALTER TABLE "dynamic_forms" ALTER COLUMN "normalized_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "dynamic_forms" ALTER COLUMN "stage" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "dynamic_forms" ALTER COLUMN "legal_area_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "dynamic_form_legal_topics" ADD CONSTRAINT "dynamic_form_legal_topics_dynamic_form_id_dynamic_forms_id_fk" FOREIGN KEY ("dynamic_form_id") REFERENCES "public"."dynamic_forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dynamic_form_legal_topics" ADD CONSTRAINT "dynamic_form_legal_topics_legal_topic_id_legal_topics_id_fk" FOREIGN KEY ("legal_topic_id") REFERENCES "public"."legal_topics"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dynamic_form_administration_audit_entries" ADD CONSTRAINT "dynamic_form_admin_audit_actor_collaborator_id_collaborators_id_fk" FOREIGN KEY ("actor_collaborator_id") REFERENCES "public"."collaborators"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dynamic_form_duplicate_operations" ADD CONSTRAINT "dynamic_form_duplicate_actor_collaborator_id_collaborators_id_fk" FOREIGN KEY ("actor_collaborator_id") REFERENCES "public"."collaborators"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dynamic_form_legal_topics_position_unique" ON "dynamic_form_legal_topics" USING btree ("dynamic_form_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "dynamic_form_admin_audit_operation_unique" ON "dynamic_form_administration_audit_entries" USING btree ("operation_key") WHERE "dynamic_form_administration_audit_entries"."operation_key" is not null;--> statement-breakpoint
CREATE INDEX "dynamic_form_admin_audit_form_time_idx" ON "dynamic_form_administration_audit_entries" USING btree ("dynamic_form_id","occurred_at");--> statement-breakpoint
ALTER TABLE "dynamic_forms" ADD CONSTRAINT "dynamic_forms_legal_area_id_legal_areas_id_fk" FOREIGN KEY ("legal_area_id") REFERENCES "public"."legal_areas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dynamic_forms_normalized_name_unique" ON "dynamic_forms" USING btree ("normalized_name");--> statement-breakpoint
CREATE UNIQUE INDEX "dynamic_forms_admin_list_idx" ON "dynamic_forms" USING btree ("stage","status","normalized_name","id");--> statement-breakpoint
ALTER TABLE "dynamic_forms" DROP COLUMN "contexts";--> statement-breakpoint
ALTER TABLE "dynamic_forms" ADD CONSTRAINT "dynamic_forms_stage_check" CHECK ("dynamic_forms"."stage" in ('consultation', 'formalization'));
