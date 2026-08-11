import { createZodDto } from 'nestjs-zod'

import { documentSpecificationTemplateUpdateSchema } from '@hms/validation/document-production'

export class UpdateDocumentSpecificationTemplateRequestDto extends createZodDto(
  documentSpecificationTemplateUpdateSchema,
) {}
