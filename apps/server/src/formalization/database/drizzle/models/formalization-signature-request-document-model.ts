import { signatureBytea } from '@/formalization/database/drizzle/signature-bytea'
import { sql } from 'drizzle-orm'
import {
  bigint,
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { formalizationSignatureRequestModel } from '@/formalization/database/drizzle/models/formalization-signature-request-model'
import { formalizationSignatureRequestDocumentStatusModel } from '@/formalization/database/drizzle/models/formalization-signature-request-document-status-model'

export const formalizationSignatureRequestDocumentModel = pgTable(
  'formalization_signature_request_documents',
  {
    id: uuid('id').primaryKey(),
    requestId: uuid('request_id').notNull(),
    sourceDocumentId: uuid('source_document_id').notNull(),
    sourceDocumentVersionId: uuid('source_document_version_id').notNull(),
    signaturePreviewId: uuid('signature_preview_id').notNull(),
    unsignedPrivateFileId: uuid('unsigned_private_file_id').notNull(),
    unsignedSha256: signatureBytea('unsigned_sha256').notNull(),
    byteCount: bigint('byte_count', { mode: 'number' }).notNull(),
    pageCount: integer('page_count').notNull(),
    position: integer('position').notNull(),
    status: formalizationSignatureRequestDocumentStatusModel('status').notNull(),
    version: integer('version').notNull().default(1),
    provisionedAt: timestamp('provisioned_at', { withTimezone: true, mode: 'date' }),
    submittedAt: timestamp('submitted_at', { withTimezone: true, mode: 'date' }),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true, mode: 'date' }),
    terminalAt: timestamp('terminal_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    uniqueIndex('formalization_signature_request_documents_source_version_uq').on(
      table.requestId,
      table.sourceDocumentVersionId,
    ),
    foreignKey({
      name: 'fs_req_doc_req_fk',
      columns: [table.requestId],
      foreignColumns: [formalizationSignatureRequestModel.id],
    }).onDelete('restrict'),
    uniqueIndex('formalization_signature_request_documents_position_uq').on(
      table.requestId,
      table.position,
    ),
    index('formalization_signature_request_documents_status_idx').on(
      table.requestId,
      table.status,
    ),
    check(
      'formalization_signature_request_documents_hash_ck',
      sql`octet_length(${table.unsignedSha256}) = 32`,
    ),
    check(
      'formalization_signature_request_documents_values_ck',
      sql`${table.byteCount} > 0 and ${table.pageCount} > 0 and ${table.position} >= 0 and ${table.version} > 0`,
    ),
  ],
)
