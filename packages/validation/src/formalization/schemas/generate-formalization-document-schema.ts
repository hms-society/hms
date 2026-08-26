import { z } from 'zod'

export const generateFormalizationDocumentSchema = z
  .object({
    instructions: z.string().trim().min(1).max(4000).optional(),
  })
  .strict()
  .default({})

export type GenerateFormalizationDocumentInput = z.infer<
  typeof generateFormalizationDocumentSchema
>
