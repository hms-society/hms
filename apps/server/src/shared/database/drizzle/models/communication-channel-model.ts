import { pgEnum } from 'drizzle-orm/pg-core'

export const communicationChannelModel = pgEnum('communication_channel', [
  'whatsapp',
  'email',
  'phone',
])
