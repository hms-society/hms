import { foreignKey, index, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core'

import { documentSpecificationLegalAreaModel } from '@/document-production/database/drizzle/models/document-specification-legal-area-model'

export const documentSpecificationLegalTopicModel = pgTable(
  'document_specification_legal_topics',
  {
    documentSpecificationId: uuid('document_specification_id').notNull(),
    legalAreaId: uuid('legal_area_id').notNull(),
    legalTopicId: uuid('legal_topic_id').notNull(),
  },
  (table) => [
    primaryKey({
      name: 'document_specification_legal_topics_pk',
      columns: [table.documentSpecificationId, table.legalAreaId, table.legalTopicId],
    }),
    foreignKey({
      name: 'document_specification_legal_topics_area_fk',
      columns: [table.documentSpecificationId, table.legalAreaId],
      foreignColumns: [
        documentSpecificationLegalAreaModel.documentSpecificationId,
        documentSpecificationLegalAreaModel.legalAreaId,
      ],
    }).onDelete('cascade'),
    index('document_specification_legal_topics_topic_idx').on(table.legalTopicId),
  ],
)
