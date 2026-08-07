import { index, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core'

import { documentSpecificationModel } from '@/document-production/database/drizzle/models/document-specification-model'

export const documentSpecificationLegalAreaModel = pgTable(
  'document_specification_legal_areas',
  {
    documentSpecificationId: uuid('document_specification_id')
      .notNull()
      .references(() => documentSpecificationModel.id, { onDelete: 'cascade' }),
    legalAreaId: uuid('legal_area_id').notNull(),
  },
  (table) => [
    primaryKey({
      name: 'document_specification_legal_areas_pk',
      columns: [table.documentSpecificationId, table.legalAreaId],
    }),
    index('document_specification_legal_areas_area_idx').on(table.legalAreaId),
  ],
)
