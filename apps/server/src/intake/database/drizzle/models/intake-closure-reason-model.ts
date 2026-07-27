import { pgEnum } from 'drizzle-orm/pg-core'

export const intakeClosureReasonModel = pgEnum('intake_closure_reason', [
  'out_of_scope',
  'legally_unviable',
  'client_withdrew',
  'unable_to_contact',
  'no_show',
  'referred',
  'other',
])
