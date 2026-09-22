CREATE TABLE IF NOT EXISTS "pendencies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "case_id" uuid NOT NULL REFERENCES "cases"("id") ON DELETE CASCADE,
  "checklist_item_id" uuid NOT NULL REFERENCES "case_checklist_items"("id") ON DELETE CASCADE,
  "document_file_id" uuid,
  "document_file_name" text,
  "reason" text NOT NULL,
  "details" text,
  "responsible_id" uuid NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "cancelled_at" timestamptz,
  "cancelled_by" uuid,
  CONSTRAINT "pendencies_reason_check" CHECK ("reason" in ('missing', 'illegible', 'incomplete', 'duplicate', 'not_corresponding'))
);
CREATE INDEX IF NOT EXISTS "pendencies_case_id_idx" ON "pendencies" ("case_id");
CREATE TABLE IF NOT EXISTS "assisted_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "pending_id" uuid NOT NULL UNIQUE REFERENCES "pendencies"("id") ON DELETE CASCADE,
  "case_id" uuid NOT NULL REFERENCES "cases"("id") ON DELETE CASCADE,
  "checklist_item_id" uuid NOT NULL REFERENCES "case_checklist_items"("id") ON DELETE CASCADE,
  "subject" text NOT NULL,
  "body" text NOT NULL,
  "sending_instructions" text NOT NULL,
  "status" text DEFAULT 'awaiting_approval' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "approved_at" timestamptz,
  "approved_by" uuid,
  CONSTRAINT "assisted_messages_status_check" CHECK ("status" in ('awaiting_approval', 'approved', 'cancelled'))
);
CREATE INDEX IF NOT EXISTS "assisted_messages_case_id_idx" ON "assisted_messages" ("case_id");
CREATE TABLE IF NOT EXISTS "pending_ai_errors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "pending_id" uuid NOT NULL REFERENCES "pendencies"("id") ON DELETE CASCADE,
  "reason" text NOT NULL,
  "recorded_by" uuid NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
