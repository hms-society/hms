import { index, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { caseTaskModel } from '@/case-management/database/drizzle/models/case-task-model'

export const caseTaskAssigneeModel = pgTable(
  'case_task_assignees',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseTaskId: uuid('case_task_id')
      .notNull()
      .references(() => caseTaskModel.id, { onDelete: 'cascade' }),
    collaboratorId: uuid('collaborator_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('case_task_assignees_task_collaborator_uidx').on(
      table.caseTaskId,
      table.collaboratorId,
    ),
    index('case_task_assignees_task_id_idx').on(table.caseTaskId),
    index('case_task_assignees_collaborator_id_idx').on(table.collaboratorId),
  ],
)
