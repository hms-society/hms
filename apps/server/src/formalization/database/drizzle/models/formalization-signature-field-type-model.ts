import { pgEnum } from 'drizzle-orm/pg-core'

export const formalizationSignatureFieldTypeModel = pgEnum(
  'formalization_signature_field_type',
  ['signature'],
)
