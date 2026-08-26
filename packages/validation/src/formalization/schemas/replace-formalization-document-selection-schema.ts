import { z } from 'zod'

export const replaceFormalizationDocumentSelectionSchema = z
  .object({
    documentSpecificationIds: z.array(z.uuid()).max(100),
  })
  .strict()

export type ReplaceFormalizationDocumentSelectionInput = z.infer<
  typeof replaceFormalizationDocumentSelectionSchema
>
