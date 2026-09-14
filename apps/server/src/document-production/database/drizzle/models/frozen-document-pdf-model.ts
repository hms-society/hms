import { sql } from 'drizzle-orm'
import {
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  bigint,
} from 'drizzle-orm/pg-core'
import { documentModel } from '@/document-production/database/drizzle/models/document-model'
import { documentSpecificationModel } from '@/document-production/database/drizzle/models/document-specification-model'
import { documentVersionModel } from '@/document-production/database/drizzle/models/document-version-model'
import type {
  DocumentPdfPage,
  DocumentVersionSource,
} from '@hms/core/document-production/domain/structures'

export const frozenDocumentPdfModel = pgTable(
  'frozen_document_pdfs',
  {
    id: uuid('id').primaryKey(),
    documentId: uuid('document_id').notNull(),
    documentVersionId: uuid('document_version_id').notNull(),
    documentVersionNumber: integer('document_version_number').notNull(),
    documentSpecificationId: uuid('document_specification_id').notNull(),
    sourceDocumentVersionId: uuid('source_document_version_id'),
    source: varchar('source', { length: 16 }).$type<DocumentVersionSource>().notNull(),
    sourceFileId: uuid('source_file_id').notNull(),
    pdfFileId: uuid('pdf_file_id').notNull(),
    sourceSha256: varchar('source_sha256', { length: 64 }).notNull(),
    pdfSha256: varchar('pdf_sha256', { length: 64 }).notNull(),
    converterVersion: varchar('converter_version', { length: 64 }).notNull(),
    pageCount: integer('page_count').notNull(),
    pages: jsonb('pages').$type<readonly DocumentPdfPage[]>().notNull().default([]),
    byteSize: bigint('byte_size', { mode: 'number' }).notNull(),
    approvedByCollaboratorId: uuid('approved_by_collaborator_id').notNull(),
    approvedAt: timestamp('approved_at', { withTimezone: true, mode: 'date' }).notNull(),
    frozenAt: timestamp('frozen_at', { withTimezone: true, mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('frozen_document_pdfs_document_version_uq').on(table.documentVersionId),
    index('frozen_document_pdfs_document_idx').on(table.documentId, table.frozenAt),
    index('frozen_document_pdfs_specification_idx').on(table.documentSpecificationId),
    foreignKey({
      columns: [table.documentId],
      foreignColumns: [documentModel.id],
      name: 'frozen_document_pdfs_document_fk',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.documentVersionId],
      foreignColumns: [documentVersionModel.id],
      name: 'frozen_document_pdfs_version_fk',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.documentSpecificationId],
      foreignColumns: [documentSpecificationModel.id],
      name: 'frozen_document_pdfs_specification_fk',
    }).onDelete('restrict'),
    check(
      'frozen_document_pdfs_hashes_ck',
      sql`${table.sourceSha256} ~ '^[a-f0-9]{64}$' and ${table.pdfSha256} ~ '^[a-f0-9]{64}$'`,
    ),
    check(
      'frozen_document_pdfs_dimensions_ck',
      sql`${table.documentVersionNumber} >= 1 and ${table.pageCount} >= 1 and jsonb_array_length(${table.pages}) = ${table.pageCount} and ${table.byteSize} > 0`,
    ),
  ],
)
