import { pgTable, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { collaboratorLegalExpertiseModel } from '@/identity/database/drizzle/models/collaborator-legal-expertise-model'

export const collaboratorLegalExpertiseTopicModel = pgTable(
  'collaborator_legal_expertise_topics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    expertiseId: uuid('expertise_id')
      .notNull()
      .references(() => collaboratorLegalExpertiseModel.id, { onDelete: 'cascade' }),
    legalTopicId: uuid('legal_topic_id').notNull(),
  },
  (table) => [
    uniqueIndex('collaborator_legal_expertise_topics_uidx').on(
      table.expertiseId,
      table.legalTopicId,
    ),
  ],
)
