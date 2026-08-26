import { z } from 'zod'

export const confirmFormalizationDocumentsSchema = z
  .object({
    expectedVersion: z.number().int().min(1),
  })
  .strict()

export type ConfirmFormalizationDocumentsInput = z.infer<
  typeof confirmFormalizationDocumentsSchema
>
