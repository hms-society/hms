import { pgEnum } from 'drizzle-orm/pg-core'

export const thirdPartyTypeModel = pgEnum('third_party_type', [
  'union',
  'association',
  'partner_company',
  'institutional_partner',
  'other',
])
