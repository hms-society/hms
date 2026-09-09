import { pgEnum } from 'drizzle-orm/pg-core'

export const formalizationSignatureSessionKindModel = pgEnum(
  'formalization_signature_session_kind',
  ['flow', 'authenticated', 'result'],
)
