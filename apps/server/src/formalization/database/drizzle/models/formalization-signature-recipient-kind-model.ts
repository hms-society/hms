import { pgEnum } from 'drizzle-orm/pg-core'

export const formalizationSignatureRecipientKindModel = pgEnum(
  'formalization_signature_recipient_kind',
  ['client', 'collaborator'],
)
