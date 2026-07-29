import { pgEnum } from 'drizzle-orm/pg-core'

export const userTypeModel = pgEnum('user_type', [
  'internal',
  'external_client',
  'external_third_party',
  'external_lawyer',
])
