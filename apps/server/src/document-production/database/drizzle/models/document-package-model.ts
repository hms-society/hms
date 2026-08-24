import { sql } from 'drizzle-orm'
import { check, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

export const documentPackageModel = pgTable(
  'document_packages',
  {
    id: uuid('id').primaryKey(),
    contextType: text('context_type').notNull(),
    contextId: uuid('context_id').notNull(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true, mode: 'date' }),
    confirmedByCollaboratorId: uuid('confirmed_by_collaborator_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      'document_packages_context_type_check',
      sql`${table.contextType} in ('consultation', 'formalization', 'case')`,
    ),
    uniqueIndex('document_packages_context_uq').on(table.contextType, table.contextId),
  ],
)
