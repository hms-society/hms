import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { clientModel } from '@/identity/database/drizzle/models/client-model'
import { userModel } from '@/identity/database/drizzle/models/user-model'

export const communicationChannelModel = pgEnum('communication_channel', ['whatsapp', 'email', 'phone'])
export const communicationDirectionModel = pgEnum('communication_direction', ['inbound', 'outbound'])

export const communicationModel = pgTable('communications', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').notNull().references(() => clientModel.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').references(() => userModel.id, { onDelete: 'set null' }),
  channel: communicationChannelModel('channel').notNull(),
  direction: communicationDirectionModel('direction').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
})