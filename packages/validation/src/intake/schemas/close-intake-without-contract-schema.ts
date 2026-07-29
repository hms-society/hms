import { z } from 'zod'

import { intakeClosureReasonSchema } from './intake-closure-reason-schema'

export const closeIntakeWithoutContractSchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  closureReason: intakeClosureReasonSchema,
  closureNotes: z.string().optional(),
  updatedBy: z.string(),
})
