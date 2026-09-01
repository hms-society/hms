import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { communicationChannelModel } from '@/shared/database/drizzle/models/communication-channel-model'

export const communicationDirectionModel = pgEnum('communication_direction', [
  'inbound',
  'outbound',
])

export const communicationModel = pgTable('communications', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').notNull(),
  authorId: uuid('author_id'),
  channel: communicationChannelModel('channel').notNull(),
  direction: communicationDirectionModel('direction').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
})
