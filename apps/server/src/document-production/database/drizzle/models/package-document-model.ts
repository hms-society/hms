import { index, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { documentModel } from '@/document-production/database/drizzle/models/document-model'
import { documentPackageModel } from '@/document-production/database/drizzle/models/document-package-model'
import { documentSpecificationModel } from '@/document-production/database/drizzle/models/document-specification-model'

export const packageDocumentModel = pgTable(
  'package_documents',
  {
    id: uuid('id').primaryKey(),
    documentPackageId: uuid('document_package_id')
      .notNull()
      .references(() => documentPackageModel.id, { onDelete: 'cascade' }),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documentModel.id, { onDelete: 'cascade' }),
    documentSpecificationId: uuid('document_specification_id')
      .notNull()
      .references(() => documentSpecificationModel.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('package_documents_package_document_uq').on(
      table.documentPackageId,
      table.documentId,
    ),
    uniqueIndex('package_documents_package_specification_uq').on(
      table.documentPackageId,
      table.documentSpecificationId,
    ),
    index('package_documents_document_id_idx').on(table.documentId),
  ],
)
