import { z } from 'zod'

import { documentTemplateContentSchema } from './document-template-content-schema'

export const saveManualDocumentVersionSchema = z
  .object({ content: documentTemplateContentSchema })
  .strict()
