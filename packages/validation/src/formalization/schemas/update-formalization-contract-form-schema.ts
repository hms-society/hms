import { z } from 'zod'

import { formalizationContractFormAnswersSchema } from './formalization-contract-form-answers-schema'

export const updateFormalizationContractFormSchema = z
  .object({
    expectedVersion: z.number().int().min(1),
    answers: formalizationContractFormAnswersSchema,
  })
  .strict()

export type UpdateFormalizationContractFormInput = z.infer<
  typeof updateFormalizationContractFormSchema
>
