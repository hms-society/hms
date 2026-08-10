import { z } from 'zod'

import { documentTemplateContentSchema } from './document-template-content-schema'
import { documentTemplateVariableSchema } from './document-template-variable-schema'

export const documentSpecificationTemplateUpdateSchema = z
  .object({
    content: documentTemplateContentSchema,
    variables: z.array(documentTemplateVariableSchema),
  })
  .strict()
