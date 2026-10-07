import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { caseTaskModel } from '@/case-management/database/drizzle/models/case-task-model'

export const caseTaskReminderModel = pgTable(
  'case_task_reminders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseTaskId: uuid('case_task_id')
      .notNull()
      .references(() => caseTaskModel.id, { onDelete: 'cascade' }),
    value: integer('value').notNull(),
    unit: text('unit').notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('case_task_reminders_task_days_before_uidx').on(
      table.caseTaskId,
      table.value,
      table.unit,
    ),
    index('case_task_reminders_task_id_idx').on(table.caseTaskId),
    check('case_task_reminders_value_check', sql`${table.value} > 0`),
  ],
)
