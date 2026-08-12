import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const documentModel = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey(),
    title: text('title').notNull(),
    currentVersionId: uuid('current_version_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('documents_current_version_id_idx').on(table.currentVersionId)],
)
