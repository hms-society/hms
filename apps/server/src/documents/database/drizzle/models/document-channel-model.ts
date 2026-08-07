import { pgEnum } from 'drizzle-orm/pg-core'

export const documentChannelModel = pgEnum('document_channel', [
  'whatsapp',
  'client_portal',
  'third_party_portal',
  'internal_upload',
])
