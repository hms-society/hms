import { pgEnum } from 'drizzle-orm/pg-core'

export const intakeContactChannelModel = pgEnum('intake_contact_channel', [
  'whatsapp',
  'email',
  'phone',
  'in_person',
])
