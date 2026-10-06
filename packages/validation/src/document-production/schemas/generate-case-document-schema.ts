import { z } from 'zod'

export const generateCaseDocumentSchema = z
  .object({
    documentSpecificationId: z.string().uuid(),
    documentFileIds: z.array(z.string().uuid()).min(1).max(100),
    instructions: z.string().trim().min(1).max(4000).optional(),
  })
  .strict()
