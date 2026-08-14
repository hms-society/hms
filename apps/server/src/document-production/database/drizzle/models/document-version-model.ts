import { sql } from 'drizzle-orm'
import type {
  DocumentPendingMarker,
  DocumentTemplateContent,
} from '@hms/core/document-production/domain/structures'
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const documentVersionModel = pgTable(
  'document_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    documentId: uuid('document_id').notNull(),
    documentGenerationId: uuid('document_generation_id'),
    sourceDocumentVersionId: uuid('source_document_version_id'),
    fileId: uuid('file_id').notNull(),
    versionNumber: integer('version_number').notNull(),
    source: text('source').notNull(),
    content: jsonb('content').$type<DocumentTemplateContent>().notNull(),
    pendingMarkers: jsonb('pending_markers')
      .$type<readonly DocumentPendingMarker[]>()
      .notNull(),
    createdByCollaboratorId: uuid('created_by_collaborator_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    status: text('status').notNull().default('in_review'),
    reviewedByCollaboratorId: uuid('reviewed_by_collaborator_id'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'date' }),
    rejectionReason: text('rejection_reason'),
  },
  (table) => [
    check('document_versions_number_check', sql`${table.versionNumber} > 0`),
    check('document_versions_source_check', sql`${table.source} in ('ai', 'manual')`),
    check(
      'document_versions_status_check',
      sql`${table.status} in ('in_review', 'approved', 'rejected')`,
    ),
    check(
      'document_versions_review_metadata_check',
      sql`(${table.status} = 'in_review' AND ${table.reviewedByCollaboratorId} IS NULL AND ${table.reviewedAt} IS NULL AND ${table.rejectionReason} IS NULL) OR (${table.status} = 'approved' AND ${table.reviewedByCollaboratorId} IS NOT NULL AND ${table.reviewedAt} IS NOT NULL AND ${table.rejectionReason} IS NULL) OR (${table.status} = 'rejected' AND ${table.reviewedByCollaboratorId} IS NOT NULL AND ${table.reviewedAt} IS NOT NULL AND ${table.rejectionReason} IS NOT NULL AND length(btrim(${table.rejectionReason})) > 0)`,
    ),
    check(
      'document_versions_content_check',
      sql`jsonb_typeof(${table.content}) = 'object' AND ${table.content}->>'type' = 'doc'`,
    ),
    check(
      'document_versions_pending_markers_check',
      sql`jsonb_typeof(${table.pendingMarkers}) = 'array'`,
    ),
    uniqueIndex('document_versions_document_number_uq').on(
      table.documentId,
      table.versionNumber,
    ),
    uniqueIndex('document_versions_generation_uq').on(table.documentGenerationId),
    index('document_versions_document_id_idx').on(table.documentId),
    index('document_versions_source_version_id_idx').on(table.sourceDocumentVersionId),
  ],
)
