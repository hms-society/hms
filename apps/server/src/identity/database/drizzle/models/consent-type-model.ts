import { pgEnum } from 'drizzle-orm/pg-core'

export const consentTypeModel = pgEnum('consent_type', [
  'data_processing',
  'whatsapp_communication',
  'email_communication',
  'third_party_sharing',
])
