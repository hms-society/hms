import { z } from 'zod'

import { createDocumentSpecificationSchema } from './create-document-specification-schema'
import { documentTemplateContentSchema } from './document-template-content-schema'
import { documentTemplateVariableSchema } from './document-template-variable-schema'

export const documentSpecificationConfigurationUpdateSchema =
  createDocumentSpecificationSchema.omit({ content: true, variables: true }).extend({
    status: z.enum(['available', 'unavailable']),
    content: documentTemplateContentSchema.optional(),
    variables: z.array(documentTemplateVariableSchema).optional(),
  })
