import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

export const documentVersionHomologationModel = pgTable(
  'document_version_homologations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id').notNull(),
    documentId: uuid('document_id').notNull(),
    documentVersionId: uuid('document_version_id').notNull(),
    approvedByCollaboratorId: uuid('approved_by_collaborator_id').notNull(),
    approvedByCollaboratorName: text('approved_by_collaborator_name').notNull(),
    approvedByCollaboratorProfile: text('approved_by_collaborator_profile').notNull(),
    approvedAt: timestamp('approved_at', { withTimezone: true, mode: 'date' }).notNull(),
    artifactFileId: uuid('artifact_file_id'),
    artifactStoragePath: text('artifact_storage_path'),
    artifactContentType: text('artifact_content_type'),
    artifactCreatedAt: timestamp('artifact_created_at', {
      withTimezone: true,
      mode: 'date',
    }),
  },
  (table) => [
    uniqueIndex('document_version_homologations_version_uq').on(table.documentVersionId),
    index('document_version_homologations_case_id_idx').on(table.caseId),
  ],
)
