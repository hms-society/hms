import { pgEnum } from 'drizzle-orm/pg-core'

export const caseClosureOutcomeModel = pgEnum('case_closure_outcome', [
  'favorable',
  'partially_favorable',
  'unfavorable',
  'agreement',
  'product_delivered',
  'withdrawal',
  'mootness',
  'other',
])
