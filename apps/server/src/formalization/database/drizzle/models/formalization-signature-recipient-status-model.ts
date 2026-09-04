import { pgEnum } from 'drizzle-orm/pg-core'

export const formalizationSignatureRecipientStatusModel = pgEnum(
  'formalization_signature_recipient_status',
  [
    'invited',
    'authenticating',
    'locked',
    'authenticated',
    'reading',
    'signing',
    'submitted',
    'reconciliation_required',
    'confirmed',
    'rejected',
    'cancelled',
    'expired',
  ],
)
