import { pgEnum } from 'drizzle-orm/pg-core'

export const caseTaskStatusModel = pgEnum('case_task_status', [
  'to_do',
  'in_progress',
  'completed',
])
