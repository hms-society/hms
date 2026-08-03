import { sql } from 'drizzle-orm'
import { pgTable, timestamp, uuid, varchar, uniqueIndex } from 'drizzle-orm/pg-core'

import { userStatusModel } from '@/identity/database/drizzle/models/user-status-model'

export const userModel = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(),
    email: varchar('email', { length: 254 }).notNull(),
    status: userStatusModel('status').notNull(),
    lastAccessAt: timestamp('last_access_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('users_email_normalized_uidx').on(sql`lower(btrim(${table.email}))`),
  ],
)
