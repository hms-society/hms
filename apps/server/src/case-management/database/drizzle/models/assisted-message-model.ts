import { sql } from 'drizzle-orm'
import { check, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { pendingModel } from './pending-model'
import { legalCaseModel } from './legal-case-model'
import { caseChecklistItemModel } from './case-checklist-item-model'

export const assistedMessageModel = pgTable(
  'assisted_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    pendingId: uuid('pending_id').references(() => pendingModel.id, { onDelete: 'cascade' }).notNull().unique(),
    caseId: uuid('case_id').references(() => legalCaseModel.id, { onDelete: 'cascade' }).notNull(),
    checklistItemId: uuid('checklist_item_id').references(() => caseChecklistItemModel.id, { onDelete: 'cascade' }).notNull(),
    subject: text('subject').notNull(),
    body: text('body').notNull(),
    status: text('status').default('awaiting_approval').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    approvedAt: timestamp('approved_at', { withTimezone: true, mode: 'date' }),
    approvedBy: uuid('approved_by'),
    sentAt: timestamp('sent_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    index('assisted_messages_case_id_idx').on(table.caseId),
    check('assisted_messages_status_check', sql`${table.status} in ('awaiting_approval', 'approved', 'sent', 'cancelled')`),
  ],
)
