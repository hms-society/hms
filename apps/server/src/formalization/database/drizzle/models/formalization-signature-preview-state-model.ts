import { pgEnum } from 'drizzle-orm/pg-core'

export const formalizationSignaturePreviewStateModel = pgEnum(
  'formalization_signature_preview_state',
  ['pending', 'processing', 'ready', 'failed', 'stale', 'cleanup_pending'],
)
