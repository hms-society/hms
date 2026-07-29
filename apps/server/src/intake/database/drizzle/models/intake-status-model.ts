import { pgEnum } from 'drizzle-orm/pg-core'

export const intakeStatusModel = pgEnum('intake_status', [
  'registered',
  'consultation_scheduled',
  'consultation_completed',
  'viability_registered',
  'in_formalization',
  'contracted',
  'closed_without_contract',
])
