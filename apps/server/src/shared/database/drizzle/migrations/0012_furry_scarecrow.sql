ALTER TABLE "document_specification_legal_topics" DROP CONSTRAINT IF EXISTS "document_specification_legal_topics_document_specification_id_legal_area_id_document_specification_legal_areas_document_specification_id_legal_area_id_fk";
--> statement-breakpoint
ALTER TABLE "document_specification_legal_areas" DROP CONSTRAINT IF EXISTS "document_specification_legal_areas_document_specification_id_legal_area_id_pk";
--> statement-breakpoint
ALTER TABLE "document_specification_legal_topics" DROP CONSTRAINT IF EXISTS "document_specification_legal_topics_document_specification_id_legal_area_id_legal_topic_id_pk";
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'document_specification_legal_areas_pk'
  ) THEN
    ALTER TABLE "document_specification_legal_areas"
      ADD CONSTRAINT "document_specification_legal_areas_pk"
      PRIMARY KEY ("document_specification_id", "legal_area_id");
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'document_specification_legal_topics_pk'
  ) THEN
    ALTER TABLE "document_specification_legal_topics"
      ADD CONSTRAINT "document_specification_legal_topics_pk"
      PRIMARY KEY ("document_specification_id", "legal_area_id", "legal_topic_id");
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'document_specification_legal_topics_area_fk'
  ) THEN
    ALTER TABLE "document_specification_legal_topics"
      ADD CONSTRAINT "document_specification_legal_topics_area_fk"
      FOREIGN KEY ("document_specification_id", "legal_area_id")
      REFERENCES "public"."document_specification_legal_areas"
        ("document_specification_id", "legal_area_id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
