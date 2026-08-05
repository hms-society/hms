ALTER TABLE "document_specification_legal_topics" DROP CONSTRAINT "document_specification_legal_topics_document_specification_legal_area_id_document_specification_legal_areas_id_fk";
--> statement-breakpoint
DROP INDEX "document_specification_legal_areas_uidx";
--> statement-breakpoint
DROP INDEX "document_specification_legal_topics_uidx";
--> statement-breakpoint
ALTER TABLE "document_specification_legal_topics" ADD COLUMN "document_specification_id" uuid;
--> statement-breakpoint
ALTER TABLE "document_specification_legal_topics" ADD COLUMN "legal_area_id" uuid;
--> statement-breakpoint
UPDATE "document_specification_legal_topics" AS topic
SET
  "document_specification_id" = area."document_specification_id",
  "legal_area_id" = area."legal_area_id"
FROM "document_specification_legal_areas" AS area
WHERE topic."document_specification_legal_area_id" = area."id";
--> statement-breakpoint
ALTER TABLE "document_specification_legal_topics" ALTER COLUMN "document_specification_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "document_specification_legal_topics" ALTER COLUMN "legal_area_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "document_specifications" ALTER COLUMN "variables" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "document_specifications" ALTER COLUMN "variables" SET DATA TYPE jsonb USING "variables"::jsonb;
--> statement-breakpoint
ALTER TABLE "document_specifications" ALTER COLUMN "variables" SET DEFAULT '[]'::jsonb;
--> statement-breakpoint
ALTER TABLE "document_specification_legal_areas" DROP COLUMN "id";
--> statement-breakpoint
ALTER TABLE "document_specification_legal_topics" DROP COLUMN "id";
--> statement-breakpoint
ALTER TABLE "document_specification_legal_topics" DROP COLUMN "document_specification_legal_area_id";
--> statement-breakpoint
ALTER TABLE "document_specification_legal_areas" ADD CONSTRAINT "document_specification_legal_areas_pk" PRIMARY KEY("document_specification_id","legal_area_id");
--> statement-breakpoint
ALTER TABLE "document_specification_legal_topics" ADD CONSTRAINT "document_specification_legal_topics_pk" PRIMARY KEY("document_specification_id","legal_area_id","legal_topic_id");
--> statement-breakpoint
ALTER TABLE "document_specification_legal_topics" ADD CONSTRAINT "document_specification_legal_topics_area_fk" FOREIGN KEY ("document_specification_id","legal_area_id") REFERENCES "public"."document_specification_legal_areas"("document_specification_id","legal_area_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "document_specification_legal_areas_area_idx" ON "document_specification_legal_areas" USING btree ("legal_area_id");
--> statement-breakpoint
CREATE INDEX "document_specification_legal_topics_topic_idx" ON "document_specification_legal_topics" USING btree ("legal_topic_id");
--> statement-breakpoint
CREATE INDEX "document_specifications_name_normalized_idx" ON "document_specifications" USING btree (lower(trim("name")));
--> statement-breakpoint
CREATE INDEX "document_specifications_moment_idx" ON "document_specifications" USING btree ("moment");
--> statement-breakpoint
CREATE INDEX "document_specifications_status_idx" ON "document_specifications" USING btree ("status");
--> statement-breakpoint
ALTER TABLE "document_specifications" ADD CONSTRAINT "document_specifications_variables_check" CHECK (jsonb_typeof("document_specifications"."variables") = 'array');
