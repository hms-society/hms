import { z } from 'zod'

export const intakeDecisionSchema = z.enum([
  'schedule_consultation',
  'register_intake',
  'close_without_contract',
])
