import { createZodDto } from 'nestjs-zod'

import { createDocumentSpecificationSchema } from '@hms/validation/document-production'

export class CreateDocumentSpecificationRequestDto extends createZodDto(
  createDocumentSpecificationSchema,
) {}
