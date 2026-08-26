import { z } from 'zod'

export const replaceFormalizationContractFormSchema = z
  .object({
    expectedVersion: z.number().int().min(1),
    dynamicFormId: z.uuid(),
  })
  .strict()

export type ReplaceFormalizationContractFormInput = z.infer<
  typeof replaceFormalizationContractFormSchema
>
