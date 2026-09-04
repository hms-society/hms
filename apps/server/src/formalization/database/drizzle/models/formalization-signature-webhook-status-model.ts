import { pgEnum } from 'drizzle-orm/pg-core'

export const formalizationSignatureWebhookStatusModel = pgEnum(
  'formalization_signature_webhook_status',
  ['pending', 'processing', 'processed', 'failed'],
)
