ALTER TABLE "case_checklist_items" ADD COLUMN IF NOT EXISTS "document_file_name" text;

UPDATE "case_checklist_items"
SET "document_file_name" = "document_batch_files"."original_name"
FROM "document_batch_files"
WHERE "case_checklist_items"."document_file_id" = "document_batch_files"."id"
  AND "case_checklist_items"."document_file_name" IS NULL;
