import { z } from 'zod'

import { confidenceSchema } from './confidence-schema'

export const documentSuggestionFieldSchema = z.object({
  label: z.string().min(1),
  value: z.string(),
  confidence: confidenceSchema.optional(),
  isRequired: z.boolean().optional(),
  isMissing: z.boolean().optional(),
})
