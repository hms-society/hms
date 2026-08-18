import { pgEnum } from 'drizzle-orm/pg-core'

export const documentStatusModel = pgEnum('document_status', [
  'awaiting_validation',
  'validated',
  'not_linked',
  'illegible',
  'incomplete',
  'duplicate',
  'not_corresponding',
  'processing_failure',
  'resend_requested',
])
