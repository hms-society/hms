import { IntakeClosureReason } from '@hms/core/intake/domain/structures'
import { z } from 'zod'

export const closeFormalizationWithoutContractSchema = z
  .object({
    expectedVersion: z.number().int().min(1),
    expectedIntakeVersion: z.number().int().min(1),
    reason: z.enum(IntakeClosureReason),
    notes: z.string().optional(),
  })
  .strict()

export type CloseFormalizationWithoutContractInput = z.infer<
  typeof closeFormalizationWithoutContractSchema
>
