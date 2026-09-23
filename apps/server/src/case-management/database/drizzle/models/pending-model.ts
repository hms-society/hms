import { sql } from 'drizzle-orm'
import { check, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { caseChecklistItemModel } from './case-checklist-item-model'
import { legalCaseModel } from './legal-case-model'

export const pendingModel = pgTable(
  'pendencies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id')
      .references(() => legalCaseModel.id, { onDelete: 'cascade' })
      .notNull(),
    checklistItemId: uuid('checklist_item_id')
      .references(() => caseChecklistItemModel.id, { onDelete: 'cascade' })
      .notNull(),
    documentFileId: uuid('document_file_id'),
    documentFileName: text('document_file_name'),
    reason: text('reason').notNull(),
    details: text('details'),
    responsibleId: uuid('responsible_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true, mode: 'date' }),
    cancelledBy: uuid('cancelled_by'),
  },
  (table) => [
    index('pendencies_case_id_idx').on(table.caseId),
    check(
      'pendencies_reason_check',
      sql`${table.reason} in ('missing', 'illegible', 'incomplete', 'duplicate', 'not_corresponding')`,
    ),
  ],
)
