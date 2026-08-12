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
    fileId: uuid('file_id').notNull(),
    versionNumber: integer('version_number').notNull(),
    source: text('source').notNull(),
    content: jsonb('content').$type<DocumentTemplateContent>().notNull(),
    pendingMarkers: jsonb('pending_markers')
      .$type<readonly DocumentPendingMarker[]>()
      .notNull(),
    createdByCollaboratorId: uuid('created_by_collaborator_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    check('document_versions_number_check', sql`${table.versionNumber} > 0`),
    check('document_versions_source_check', sql`${table.source} in ('ai', 'manual')`),
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
  ],
)
