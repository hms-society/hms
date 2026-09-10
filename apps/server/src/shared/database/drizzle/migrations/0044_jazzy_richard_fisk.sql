CREATE TABLE "checklist_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	CONSTRAINT "checklist_templates_name_not_blank_check" CHECK (char_length(btrim("checklist_templates"."name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "checklist_template_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"checklist_template_id" uuid NOT NULL,
	"title" text NOT NULL,
	"document_type" text NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	CONSTRAINT "checklist_template_items_title_not_blank_check" CHECK (char_length(btrim("checklist_template_items"."title")) > 0),
	CONSTRAINT "checklist_template_items_document_type_not_blank_check" CHECK (char_length(btrim("checklist_template_items"."document_type")) > 0),
	CONSTRAINT "checklist_template_items_position_check" CHECK ("checklist_template_items"."position" >= 0)
);
--> statement-breakpoint
ALTER TABLE "checklist_template_items" ADD CONSTRAINT "checklist_template_items_checklist_template_id_checklist_templates_id_fk" FOREIGN KEY ("checklist_template_id") REFERENCES "public"."checklist_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "checklist_templates_updated_at_idx" ON "checklist_templates" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "checklist_template_items_template_id_idx" ON "checklist_template_items" USING btree ("checklist_template_id");