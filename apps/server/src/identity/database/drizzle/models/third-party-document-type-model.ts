import { pgEnum } from 'drizzle-orm/pg-core'

export const thirdPartyDocumentTypeModel = pgEnum('third_party_document_type', [
  'cnpj',
  'official_registration',
  'other_national_document',
])
