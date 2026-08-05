import { pgEnum } from 'drizzle-orm/pg-core'

export const documentStatusModel = pgEnum('document_status', [
  'awaiting_validation',
  'validated',
  'illegible',
  'incomplete',
  'duplicate',
  'processing_failure'
])