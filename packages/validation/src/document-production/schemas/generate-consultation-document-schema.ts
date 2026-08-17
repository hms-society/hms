import { z } from 'zod'

export const generateConsultationDocumentSchema = z
  .object({
    instructions: z.string().trim().min(1).max(4000).optional(),
  })
  .strict()
  .default({})
