import type {
  DocumentExceptionStatus,
  DocumentExceptionType,
} from '@hms/core/document-engine/domain/structures'
import { sql } from 'drizzle-orm'
import { check, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const documentExceptionModel = pgTable(
  'document_exceptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    documentId: uuid('document_id').notNull(),
    caseId: uuid('case_id').notNull(),
    type: text('type').$type<DocumentExceptionType>().notNull(),
    status: text('status').$type<DocumentExceptionStatus>().notNull(),
    justification: text('justification').notNull(),
    deadlineDate: timestamp('deadline_date', { withTimezone: true }),
    createdBy: uuid('created_by').notNull(),
    reviewedBy: uuid('reviewed_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      'document_exceptions_type_check',
      sql`${table.type} in ('DISPENSA_DEFINITIVA', 'ACEITE_PROVISORIO')`,
    ),
    check(
      'document_exceptions_status_check',
      sql`${table.status} in ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')`,
    ),
  ],
)
