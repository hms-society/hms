import { replaceConsultationDocumentSelectionSchema } from '@hms/validation/document-production'
import { createZodDto } from 'nestjs-zod'

export class ReplaceConsultationDocumentSelectionRequestDto extends createZodDto(
  replaceConsultationDocumentSelectionSchema,
) {}
