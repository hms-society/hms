import { pgEnum } from 'drizzle-orm/pg-core'

export const registrationAttemptStatusModel = pgEnum('registration_attempt_status', [
  'pending_auth',
  'auth_invited',
  'completed',
  'reconciliation_required',
])
