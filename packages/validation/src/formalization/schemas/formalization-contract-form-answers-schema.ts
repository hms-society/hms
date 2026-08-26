import { z } from 'zod'

const formalizationContractFormAnswerValueSchema = z.union([
  z.string(),
  z.number().finite(),
  z.boolean(),
  z.array(z.string()),
  z.null(),
])

export const formalizationContractFormAnswerSchema = z
  .object({
    fieldId: z.uuid(),
    value: formalizationContractFormAnswerValueSchema,
  })
  .strict()

export const formalizationContractFormAnswersSchema = z.array(
  formalizationContractFormAnswerSchema,
)

export type FormalizationContractFormAnswerInput = z.infer<
  typeof formalizationContractFormAnswerSchema
>

export type FormalizationContractFormAnswersInput = z.infer<
  typeof formalizationContractFormAnswersSchema
>
