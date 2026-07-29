import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

import { userStatusModel } from '@/identity/database/drizzle/models/user-status-model'

export const userModel = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: varchar('email', { length: 254 }).notNull().unique(),
  status: userStatusModel('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
})
