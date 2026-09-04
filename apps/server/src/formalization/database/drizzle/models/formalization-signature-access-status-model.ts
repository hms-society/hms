import { pgEnum } from 'drizzle-orm/pg-core'

export const formalizationSignatureAccessStatusModel = pgEnum(
  'formalization_signature_access_status',
  ['active', 'revoked', 'expired'],
)
