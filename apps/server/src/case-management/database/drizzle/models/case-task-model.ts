import { sql } from 'drizzle-orm'
import {
  check,
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

import { legalCaseModel } from '@/case-management/database/drizzle/models/legal-case-model'
import { caseTaskSourceModel } from '@/case-management/database/drizzle/models/case-task-source-model'
import { caseTaskStatusModel } from '@/case-management/database/drizzle/models/case-task-status-model'
import { caseTaskTypeModel } from '@/case-management/database/drizzle/models/case-task-type-model'

export const caseTaskModel = pgTable(
  'case_tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id')
      .notNull()
      .references(() => legalCaseModel.id, { onDelete: 'cascade' }),
    type: caseTaskTypeModel('type').notNull(),
    title: text('title').notNull(),
    customType: text('custom_type'),
    description: text('description').notNull(),
    plannedDate: date('planned_date', { mode: 'string' }).notNull(),
    plannedTime: time('planned_time', { precision: 0, withTimezone: false }),
    status: caseTaskStatusModel('status').default('to_do').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    createdById: uuid('created_by_id').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
    completedById: uuid('completed_by_id'),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
    version: integer('version').default(1).notNull(),
    source: caseTaskSourceModel('source').default('manual').notNull(),
    blocksCaseClosure: boolean('blocks_case_closure').default(false).notNull(),
    completionNote: text('completion_note'),
    lastReminderAt: timestamp('last_reminder_at', {
      withTimezone: true,
      mode: 'date',
    }),
  },
  (table) => [
    index('case_tasks_case_id_idx').on(table.caseId),
    index('case_tasks_case_planned_date_idx').on(table.caseId, table.plannedDate),
    index('case_tasks_deleted_at_idx').on(table.deletedAt),
    check(
      'case_tasks_description_not_blank_check',
      sql`char_length(btrim(${table.description})) > 0`,
    ),
    check(
      'case_tasks_custom_type_check',
      sql`${table.type} <> 'other' OR (${table.customType} IS NOT NULL AND char_length(btrim(${table.customType})) > 0)`,
    ),
    check('case_tasks_version_check', sql`${table.version} > 0`),
    check(
      'case_tasks_updated_after_created_check',
      sql`${table.updatedAt} >= ${table.createdAt}`,
    ),
  ],
)
