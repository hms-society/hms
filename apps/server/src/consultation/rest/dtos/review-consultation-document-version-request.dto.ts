import { reviewDocumentVersionSchema } from '@hms/validation/document-production'
import { z } from 'zod'

export type ReviewConsultationDocumentVersionRequestDto = z.infer<
  typeof reviewDocumentVersionSchema
>
