ALTER TABLE "checklist_templates" ADD COLUMN "legal_area_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "checklist_templates" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "checklist_templates" ADD CONSTRAINT "checklist_templates_legal_area_id_legal_areas_id_fk" FOREIGN KEY ("legal_area_id") REFERENCES "public"."legal_areas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "checklist_templates_legal_area_id_uidx" ON "checklist_templates" USING btree ("legal_area_id");