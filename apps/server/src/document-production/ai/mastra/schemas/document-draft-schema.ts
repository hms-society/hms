import { documentTemplateContentSchema } from '@hms/validation/document-production'
import { z } from 'zod'

export const documentDraftSchema = z.object({
  content: documentTemplateContentSchema,
})
