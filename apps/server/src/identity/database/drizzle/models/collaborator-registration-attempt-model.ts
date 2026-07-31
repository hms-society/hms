import { pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'

import { registrationAttemptStatusModel } from '@/identity/database/drizzle/models/registration-attempt-status-model'

export const collaboratorRegistrationAttemptModel = pgTable(
  'collaborator_registration_attempts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    normalizedEmail: varchar('normalized_email', { length: 254 }).notNull(),
    payloadHash: varchar('payload_hash', { length: 128 }).notNull(),
    authUserId: uuid('auth_user_id'),
    status: registrationAttemptStatusModel('status').notNull(),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('collaborator_registration_attempts_email_uidx').on(
      table.normalizedEmail,
    ),
  ],
)
