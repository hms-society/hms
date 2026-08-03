import { pgTable, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { collaboratorModel } from '@/identity/database/drizzle/models/collaborator-model'

export const collaboratorLegalExpertiseModel = pgTable(
  'collaborator_legal_expertises',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    collaboratorId: uuid('collaborator_id')
      .notNull()
      .references(() => collaboratorModel.id, { onDelete: 'cascade' }),
    legalAreaId: uuid('legal_area_id').notNull(),
  },
  (table) => [
    uniqueIndex('collaborator_legal_expertises_area_uidx').on(
      table.collaboratorId,
      table.legalAreaId,
    ),
  ],
)
