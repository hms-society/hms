import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { userModel } from '@/identity/database/drizzle/models'
import { documentBatchFileModel } from './document-batch-file-model'
import { documentStatusModel } from './document-status-model'

export const documentValidationLogModel = pgTable(
  'document_validation_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    documentFileId: uuid('document_file_id')
      .references(() => documentBatchFileModel.id, { onDelete: 'cascade' })
      .notNull(),
    actorId: uuid('actor_id').references(() => userModel.id, {
      onDelete: 'set null',
    }),
    action: text('action').notNull(),
    status: documentStatusModel('status'),
    decision: text('decision'),
    reason: text('reason'),
    message: text('message'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('document_validation_logs_file_idx').on(table.documentFileId),
    index('document_validation_logs_actor_idx').on(table.actorId),
    index('document_validation_logs_action_idx').on(table.action),
    index('document_validation_logs_created_at_idx').on(table.createdAt),
  ],
)
