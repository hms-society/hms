import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { documentBatchModel } from './document-batch-model'

export const documentBatchFileModel = pgTable(
  'document_batch_files',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    batchId: uuid('batch_id')
      .notNull()
      .references(() => documentBatchModel.id, { onDelete: 'cascade' }),
    storagePath: text('storage_path').notNull(),
    originalName: text('original_name').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
)