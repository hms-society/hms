import { z } from 'zod'

export const reopenFormalizationContractFormSchema = z
  .object({
    expectedVersion: z.number().int().min(1),
  })
  .strict()

export type ReopenFormalizationContractFormInput = z.infer<
  typeof reopenFormalizationContractFormSchema
>
