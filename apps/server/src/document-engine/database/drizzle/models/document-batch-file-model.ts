import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  jsonb,
  boolean,
  AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { userModel } from '@/identity/database/drizzle/models'
import { documentBatchModel } from './document-batch-model'
import { documentStatusModel } from './document-status-model'

export const documentBatchFileModel = pgTable('document_batch_files', {
  id: uuid('id').defaultRandom().primaryKey(),
  batchId: uuid('batch_id')
    .references(() => documentBatchModel.id, { onDelete: 'cascade' })
    .notNull(),
  storagePath: text('storage_path').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  hashSha256: text('hash_sha256'),
  status: documentStatusModel('status'),
  caseId: uuid('case_id'),
  checklistItemId: uuid('checklist_item_id'),
  aiConfidence: integer('ai_confidence'),
  extractedFields: jsonb('extracted_fields'),
  missingFields: jsonb('missing_fields'),
  isDuplicate: boolean('is_duplicate').default(false).notNull(),
  originalDocumentId: uuid('original_document_id').references(
    (): AnyPgColumn => documentBatchFileModel.id,
    { onDelete: 'set null' },
  ),
  aiSuggestion: jsonb('ai_suggestion'),
  humanCorrection: jsonb('human_correction'),
  reviewedBy: uuid('reviewed_by').references(() => userModel.id, {
    onDelete: 'set null',
  }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
