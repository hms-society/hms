import { sql } from 'drizzle-orm'
import { check, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

export const appointmentModel = pgTable(
  'appointments',
  {
    id: uuid('id').primaryKey(),
    intakeId: uuid('intake_id').notNull(),
    scheduleId: uuid('schedule_id').notNull(),
    clientId: uuid('client_id').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true, mode: 'date' }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true, mode: 'date' }).notNull(),
    status: text('status').notNull(),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('appointments_intake_id_uq').on(table.intakeId),
    check(
      'appointments_status_check',
      sql`${table.status} in ('scheduled', 'cancelled')`,
    ),
    check('appointments_period_check', sql`${table.endsAt} > ${table.startsAt}`),
  ],
)
