import { pgEnum } from 'drizzle-orm/pg-core'

export const formalizationSignatureRequestStatusModel = pgEnum(
  'formalization_signature_request_status',
  [
    'provisioning',
    'sending',
    'sent',
    'in_progress',
    'partially_submitted',
    'submitted',
    'reconciliation_required',
    'confirmed',
    'rejected',
    'cancelled',
    'expired',
    'failed',
  ],
)
