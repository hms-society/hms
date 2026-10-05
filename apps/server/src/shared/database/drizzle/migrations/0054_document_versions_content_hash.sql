ALTER TABLE "document_versions" ADD COLUMN IF NOT EXISTS "content_hash" text;

CREATE INDEX IF NOT EXISTS "document_versions_content_hash_idx"
  ON "document_versions" ("content_hash");
