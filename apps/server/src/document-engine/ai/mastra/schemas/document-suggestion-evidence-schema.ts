import { z } from 'zod'

export const documentSuggestionEvidenceSchema = z.object({
  field: z.string().min(1),
  sourceText: z.string().min(1),
})
