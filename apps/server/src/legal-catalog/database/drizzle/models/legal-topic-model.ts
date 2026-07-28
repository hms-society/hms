import { sql } from 'drizzle-orm'
import { boolean, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { legalAreaModel } from '@/legal-catalog/database/drizzle/models/legal-area-model'

export const legalTopicModel = pgTable(
  'legal_topics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    legalAreaId: uuid('legal_area_id')
      .notNull()
      .references(() => legalAreaModel.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('legal_topics_area_name_uidx').on(
      table.legalAreaId,
      sql`lower(btrim(${table.name}))`,
    ),
  ],
)
