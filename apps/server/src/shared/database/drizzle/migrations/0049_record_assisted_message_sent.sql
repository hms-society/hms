ALTER TABLE "assisted_messages" ADD COLUMN IF NOT EXISTS "sent_at" timestamptz;
ALTER TABLE "assisted_messages" DROP CONSTRAINT IF EXISTS "assisted_messages_status_check";
ALTER TABLE "assisted_messages" ADD CONSTRAINT "assisted_messages_status_check" CHECK ("status" in ('awaiting_approval', 'approved', 'sent', 'cancelled'));
