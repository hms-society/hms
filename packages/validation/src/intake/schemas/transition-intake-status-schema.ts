import { z } from 'zod'

import { intakeStatusSchema } from './intake-status-schema'

export const transitionIntakeStatusSchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  status: intakeStatusSchema,
  updatedBy: z.string(),
})
