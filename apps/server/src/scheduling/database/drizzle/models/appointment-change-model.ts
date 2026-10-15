import { sql } from 'drizzle-orm'
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { appointmentModel } from '@/scheduling/database/drizzle/models/appointment-model'
import { schedules } from '@/shared/database/drizzle/schema/scheduling'

export const appointmentChangeModel = pgTable(
  'appointment_changes',
  {
    id: uuid('id').primaryKey(),
    appointmentId: uuid('appointment_id')
      .notNull()
      .references(() => appointmentModel.id, { onDelete: 'restrict' }),
    kind: text('kind').notNull(),
    actorId: uuid('actor_id').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'date' }).notNull(),
    previousScheduleId: uuid('previous_schedule_id').references(() => schedules.id, {
      onDelete: 'restrict',
    }),
    newScheduleId: uuid('new_schedule_id').references(() => schedules.id, {
      onDelete: 'restrict',
    }),
    previousStartsAt: timestamp('previous_starts_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    previousEndsAt: timestamp('previous_ends_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    newStartsAt: timestamp('new_starts_at', { withTimezone: true, mode: 'date' }),
    newEndsAt: timestamp('new_ends_at', { withTimezone: true, mode: 'date' }),
    previousRevision: timestamp('previous_revision', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    resultingRevision: timestamp('resulting_revision', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    index('appointment_changes_appointment_occurrence_idx').on(
      table.appointmentId,
      table.occurredAt,
      table.id,
    ),
    index('appointment_changes_pending_idx')
      .on(table.occurredAt, table.id)
      .where(sql`${table.publishedAt} is null`),
    uniqueIndex('appointment_changes_revision_uq').on(
      table.appointmentId,
      table.previousRevision,
      table.kind,
    ),
    check(
      'appointment_changes_kind_check',
      sql`${table.kind} in ('cancelled', 'rescheduled')`,
    ),
    check(
      'appointment_changes_period_check',
      sql`(${table.kind} = 'cancelled' and ${table.newStartsAt} is null and ${table.newEndsAt} is null) or (${table.kind} = 'rescheduled' and ${table.newStartsAt} is not null and ${table.newEndsAt} is not null and ${table.newEndsAt} > ${table.newStartsAt})`,
    ),
    check(
      'appointment_changes_schedule_pair_check',
      sql`(${table.previousScheduleId} is null) = (${table.newScheduleId} is null)`,
    ),
    check(
      'appointment_changes_revision_check',
      sql`${table.resultingRevision} > ${table.previousRevision}`,
    ),
  ],
)
