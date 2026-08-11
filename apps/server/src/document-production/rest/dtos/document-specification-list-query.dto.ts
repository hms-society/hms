import { createZodDto } from 'nestjs-zod'
import { documentSpecificationListQuerySchema } from '@hms/validation/document-production'

export class DocumentSpecificationListQueryDto extends createZodDto(
  documentSpecificationListQuerySchema,
) {}
