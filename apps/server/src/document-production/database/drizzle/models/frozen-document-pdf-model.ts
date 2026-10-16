import type {
  DocumentPdfPage,
  DocumentVersionSource,
} from '@hms/core/document-production/domain/structures'
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const frozenDocumentPdfModel = pgTable(
  'frozen_document_pdfs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    documentId: uuid('document_id').notNull(),
    documentVersionId: uuid('document_version_id').notNull(),
    documentVersionNumber: integer('document_version_number').notNull(),
    documentSpecificationId: uuid('document_specification_id').notNull(),
    sourceDocumentVersionId: uuid('source_document_version_id'),
    source: text('source').$type<DocumentVersionSource>().notNull(),
    sourceFileId: uuid('source_file_id').notNull(),
    pdfFileId: uuid('pdf_file_id').notNull(),
    sourceSha256: text('source_sha256').notNull(),
    pdfSha256: text('pdf_sha256').notNull(),
    converterVersion: text('converter_version').notNull(),
    pageCount: integer('page_count').notNull(),
    pages: jsonb('pages').$type<readonly DocumentPdfPage[]>().notNull(),
    byteSize: integer('byte_size').notNull(),
    approvedByCollaboratorId: uuid('approved_by_collaborator_id').notNull(),
    approvedAt: timestamp('approved_at', { withTimezone: true, mode: 'date' }).notNull(),
    frozenAt: timestamp('frozen_at', { withTimezone: true, mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('frozen_document_pdfs_version_uq').on(table.documentVersionId),
    index('frozen_document_pdfs_document_id_idx').on(table.documentId),
  ],
)
