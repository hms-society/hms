import { pgTable, text, timestamp, uuid, integer, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const schedules = pgTable('schedules', {
  id: uuid('id').defaultRandom().primaryKey(),
  collaboratorId: uuid('collaborator_id').notNull().unique(),
  defaultDurationMinutes: integer('default_duration_minutes').default(45).notNull(),
  weeklyAvailability: jsonb('weekly_availability').notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const blockedPeriods = pgTable('blocked_periods', {
  id: uuid('id').defaultRandom().primaryKey(),
  scheduleId: uuid('schedule_id')
    .references(() => schedules.id, { onDelete: 'cascade' })
    .notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const schedulesRelations = relations(schedules, ({ many }) => ({
  blockedPeriods: many(blockedPeriods),
}))

export const blockedPeriodsRelations = relations(blockedPeriods, ({ one }) => ({
  schedule: one(schedules, {
    fields: [blockedPeriods.scheduleId],
    references: [schedules.id],
  }),
}))
