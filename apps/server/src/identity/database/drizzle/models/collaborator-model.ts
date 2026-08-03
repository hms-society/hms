import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { userModel } from '@/identity/database/drizzle/models/user-model'
import { collaboratorProfileModel } from '@/identity/database/drizzle/models/collaborator-profile-model'

export const collaboratorModel = pgTable(
  'collaborators',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => userModel.id, { onDelete: 'cascade' }),
    professionalName: text('professional_name').notNull(),
    jobTitle: text('job_title'),
    profile: collaboratorProfileModel('profile').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('collaborators_user_id_uidx').on(table.userId),
    index('collaborators_profile_idx').on(table.profile),
  ],
)
