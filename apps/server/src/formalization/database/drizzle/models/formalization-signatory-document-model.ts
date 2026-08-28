import {
  foreignKey,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { formalizationModel } from '@/formalization/database/drizzle/models/formalization-model'
import { formalizationSignatoryModel } from '@/formalization/database/drizzle/models/formalization-signatory-model'

export const formalizationSignatoryDocumentModel = pgTable(
  'formalization_signatory_documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    formalizationId: uuid('formalization_id')
      .notNull()
      .references(() => formalizationModel.id, { onDelete: 'cascade' }),
    signatoryId: uuid('signatory_id')
      .notNull()
      .references(() => formalizationSignatoryModel.id, { onDelete: 'cascade' }),
    documentId: uuid('document_id').notNull(),
    documentVersionId: uuid('document_version_id').notNull(),
    createdByCollaboratorId: uuid('created_by_collaborator_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('formalization_signatory_documents_pair_uq').on(
      table.signatoryId,
      table.documentId,
    ),
    index('formalization_signatory_documents_owner_document_idx').on(
      table.formalizationId,
      table.documentId,
    ),
    foreignKey({
      name: 'formalization_signatory_documents_owner_signatory_fk',
      columns: [table.formalizationId, table.signatoryId],
      foreignColumns: [
        formalizationSignatoryModel.formalizationId,
        formalizationSignatoryModel.id,
      ],
    }).onDelete('cascade'),
  ],
)
