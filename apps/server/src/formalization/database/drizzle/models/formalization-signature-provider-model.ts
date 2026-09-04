import { pgEnum } from 'drizzle-orm/pg-core'

export const formalizationSignatureProviderModel = pgEnum(
  'formalization_signature_provider',
  ['documenso'],
)
