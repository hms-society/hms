import {
  legalTopicInputSchema,
  legalTopicUpdateSchema,
} from '@hms/validation/legal-catalog'
import { createZodDto } from 'nestjs-zod'

export class LegalTopicInputDto extends createZodDto(legalTopicInputSchema) {}

export class LegalTopicUpdateDto extends createZodDto(legalTopicUpdateSchema) {}
