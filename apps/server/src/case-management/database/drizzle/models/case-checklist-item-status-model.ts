import { pgEnum } from 'drizzle-orm/pg-core'

export const caseChecklistItemStatusModel = pgEnum('case_checklist_item_status', [
  'pending',
  'validated',
])
