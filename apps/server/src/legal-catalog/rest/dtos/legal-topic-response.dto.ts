import { legalTopicSchema } from '@hms/validation/legal-catalog'
import { createZodDto } from 'nestjs-zod'

export class LegalTopicResponseDto extends createZodDto(legalTopicSchema) {}
