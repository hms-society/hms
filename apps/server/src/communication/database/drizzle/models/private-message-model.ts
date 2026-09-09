import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { communicationDirectionModel } from './communication-model'

export const privateMessageModel = pgTable('private_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').notNull(),
  collaboratorId: uuid('collaborator_id').notNull(),
  intakeId: uuid('intake_id').notNull(),
  clientPhone: text('client_phone'),
  direction: communicationDirectionModel('direction').notNull(),
  content: text('content'),
  fileIds: jsonb('file_ids').$type<string[]>().default([]).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
})
