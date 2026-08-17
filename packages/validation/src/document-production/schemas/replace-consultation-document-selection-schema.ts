import { z } from 'zod'

export const replaceConsultationDocumentSelectionSchema = z
  .object({
    documentSpecificationIds: z.array(z.uuid()).max(100),
  })
  .strict()
