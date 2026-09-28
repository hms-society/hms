import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const schedules = pgTable(
  'schedules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    collaboratorId: uuid('collaborator_id').notNull().unique(),
    defaultDurationMinutes: integer('default_duration_minutes').default(45).notNull(),
    weeklyAvailability: jsonb('weekly_availability').notNull().default([]),
    timeZone: text('time_zone').notNull().default('America/Sao_Paulo'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    check('schedules_time_zone_nonempty_check', sql`length(${table.timeZone}) > 0`),
  ],
)

export const blockedPeriods = pgTable(
  'blocked_periods',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    scheduleId: uuid('schedule_id')
      .references(() => schedules.id, { onDelete: 'cascade' })
      .notNull(),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),
    description: text('description').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('blocked_periods_schedule_period_idx').on(
      table.scheduleId,
      table.startDate,
      table.endDate,
    ),
  ],
)

export const schedulesRelations = relations(schedules, ({ many }) => ({
  blockedPeriods: many(blockedPeriods),
}))

export const blockedPeriodsRelations = relations(blockedPeriods, ({ one }) => ({
  schedule: one(schedules, {
    fields: [blockedPeriods.scheduleId],
    references: [schedules.id],
  }),
}))
