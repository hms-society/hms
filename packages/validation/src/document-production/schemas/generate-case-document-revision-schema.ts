import { z } from 'zod'

export const generateCaseDocumentRevisionSchema = z
  .object({ instructions: z.string().trim().min(1).max(4000) })
  .strict()
