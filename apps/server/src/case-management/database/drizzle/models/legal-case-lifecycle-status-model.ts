import { pgEnum } from 'drizzle-orm/pg-core'

export const legalCaseLifecycleStatusModel = pgEnum('legal_case_lifecycle_status', [
  'active',
  'closed',
])
