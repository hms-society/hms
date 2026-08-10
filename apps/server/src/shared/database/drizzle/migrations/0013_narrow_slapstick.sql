ALTER TYPE "public"."collaborator_profile" ADD VALUE 'client';--> statement-breakpoint
CREATE TABLE "document_specification_legal_areas" (
	"document_specification_id" uuid NOT NULL,
	"legal_area_id" uuid NOT NULL,
	CONSTRAINT "document_specification_legal_areas_pk" PRIMARY KEY("document_specification_id","legal_area_id")
);
--> statement-breakpoint
CREATE TABLE "document_specification_legal_topics" (
	"document_specification_id" uuid NOT NULL,
	"legal_area_id" uuid NOT NULL,
	"legal_topic_id" uuid NOT NULL,
	CONSTRAINT "document_specification_legal_topics_pk" PRIMARY KEY("document_specification_id","legal_area_id","legal_topic_id")
);
--> statement-breakpoint
CREATE TABLE "document_specifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"content" text NOT NULL,
	"variables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"moment" text NOT NULL,
	"scope" text NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_specifications_moment_check" CHECK ("document_specifications"."moment" in ('consultation', 'formalization', 'legal_production')),
	CONSTRAINT "document_specifications_scope_check" CHECK ("document_specifications"."scope" in ('global', 'legal_context')),
	CONSTRAINT "document_specifications_status_check" CHECK ("document_specifications"."status" in ('available', 'unavailable')),
	CONSTRAINT "document_specifications_variables_check" CHECK (jsonb_typeof("document_specifications"."variables") = 'array')
);
--> statement-breakpoint
ALTER TABLE "document_specification_legal_areas" ADD CONSTRAINT "document_specification_legal_areas_document_specification_id_document_specifications_id_fk" FOREIGN KEY ("document_specification_id") REFERENCES "public"."document_specifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_specification_legal_topics" ADD CONSTRAINT "document_specification_legal_topics_area_fk" FOREIGN KEY ("document_specification_id","legal_area_id") REFERENCES "public"."document_specification_legal_areas"("document_specification_id","legal_area_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "document_specification_legal_areas_area_idx" ON "document_specification_legal_areas" USING btree ("legal_area_id");--> statement-breakpoint
CREATE INDEX "document_specification_legal_topics_topic_idx" ON "document_specification_legal_topics" USING btree ("legal_topic_id");--> statement-breakpoint
CREATE INDEX "document_specifications_name_normalized_idx" ON "document_specifications" USING btree (lower(trim("name")));--> statement-breakpoint
CREATE INDEX "document_specifications_moment_idx" ON "document_specifications" USING btree ("moment");--> statement-breakpoint
CREATE INDEX "document_specifications_status_idx" ON "document_specifications" USING btree ("status");