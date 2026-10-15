import { pgEnum } from 'drizzle-orm/pg-core'

export const caseTaskSourceModel = pgEnum('case_task_source', [
  'manual',
  'automation',
  'import',
])
