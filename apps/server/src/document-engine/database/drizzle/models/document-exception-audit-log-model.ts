import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { documentExceptionModel } from './document-exception-model'

export const documentExceptionAuditLogModel = pgTable('document_exception_audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentExceptionId: uuid('document_exception_id')
    .notNull()
    .references(() => documentExceptionModel.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  userId: uuid('user_id').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
