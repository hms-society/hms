import { z } from 'zod'

import { documentTemplateContentSchema } from '../../document-production/schemas/document-template-content-schema'

export const saveFormalizationDocumentVersionSchema = z
  .object({
    sourceDocumentVersionId: z.uuid(),
    content: documentTemplateContentSchema,
  })
  .strict()

export type SaveFormalizationDocumentVersionInput = z.infer<
  typeof saveFormalizationDocumentVersionSchema
>
