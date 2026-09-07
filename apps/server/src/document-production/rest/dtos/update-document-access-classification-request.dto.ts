import { createZodDto } from 'nestjs-zod'
import { updateDocumentAccessClassificationSchema } from '@hms/validation/document-production'

export class UpdateDocumentAccessClassificationRequestDto extends createZodDto(
  updateDocumentAccessClassificationSchema,
) {}
