CREATE TABLE IF NOT EXISTS "document_validation_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "document_file_id" uuid NOT NULL,
  "actor_id" uuid,
  "action" text NOT NULL,
  "status" "document_status",
  "decision" text,
  "reason" text,
  "message" text,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "document_validation_logs_document_file_id_document_batch_files_id_fk"
    FOREIGN KEY ("document_file_id")
    REFERENCES "public"."document_batch_files"("id")
    ON DELETE cascade
    ON UPDATE no action,
  CONSTRAINT "document_validation_logs_actor_id_users_id_fk"
    FOREIGN KEY ("actor_id")
    REFERENCES "public"."users"("id")
    ON DELETE set null
    ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "document_validation_logs_file_idx"
  ON "document_validation_logs" USING btree ("document_file_id");

CREATE INDEX IF NOT EXISTS "document_validation_logs_actor_idx"
  ON "document_validation_logs" USING btree ("actor_id");

CREATE INDEX IF NOT EXISTS "document_validation_logs_action_idx"
  ON "document_validation_logs" USING btree ("action");

CREATE INDEX IF NOT EXISTS "document_validation_logs_created_at_idx"
  ON "document_validation_logs" USING btree ("created_at");
