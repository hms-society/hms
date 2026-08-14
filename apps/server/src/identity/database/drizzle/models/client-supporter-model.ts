import { index, boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { clientModel } from './client-model'

export const clientSupporterModel = pgTable(
  'client_document_supporters',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clientId: uuid('client_id')
      .references(() => clientModel.id, { onDelete: 'cascade' })
      .notNull(),
    supporterPhone: text('supporter_phone').notNull(),
    supporterName: text('supporter_name'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('client_supporters_phone_idx').on(table.supporterPhone),
    index('client_supporters_client_id_idx').on(table.clientId),
  ],
)
