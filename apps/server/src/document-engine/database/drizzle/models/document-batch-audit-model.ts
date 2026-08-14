import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const documentBatchAuditModel = pgTable(
  'document_batch_audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    batchId: uuid('batch_id'),
    fileName: text('file_name').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    hashSha256: text('hash_sha256'),
    sender: text('sender').notNull(),
    status: text('status').notNull(),
    details: text('details'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('document_batch_audits_batch_idx').on(table.batchId),
    index('document_batch_audits_sender_idx').on(table.sender),
  ],
)
