import { pgEnum } from 'drizzle-orm/pg-core'

export const documentBatchStatusModel = pgEnum('document_batch_status', [
  'received',
  'pending_identification',
  'identified',
  'automatic_triage_in_progress',
  'triage_completed',
  'pending_human_review',
  'processed',
  'with_error',
])
