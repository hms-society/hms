import { z } from 'zod'

import { createDocumentSpecificationSchema } from './create-document-specification-schema'

export const documentSpecificationConfigurationUpdateSchema =
  createDocumentSpecificationSchema.extend({
    status: z.enum(['available', 'unavailable']),
  })
