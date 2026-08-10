import { createZodDto } from 'nestjs-zod'

import { documentSpecificationConfigurationUpdateSchema } from '@hms/validation/document-production'

export class UpdateDocumentSpecificationConfigurationRequestDto extends createZodDto(
  documentSpecificationConfigurationUpdateSchema,
) {}
