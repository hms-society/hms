import { sql } from 'drizzle-orm'
import { boolean, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

export const legalAreaModel = pgTable(
  'legal_areas',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex('legal_areas_name_uidx').on(sql`lower(btrim(${table.name}))`)],
)
