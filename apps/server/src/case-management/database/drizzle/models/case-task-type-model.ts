import { pgEnum } from 'drizzle-orm/pg-core'

export const caseTaskTypeModel = pgEnum('case_task_type', [
  'process_deadline',
  'hearing',
  'publication',
  'internal_task',
  'delivery',
  'other',
])
