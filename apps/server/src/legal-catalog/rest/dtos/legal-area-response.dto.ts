import { legalAreaSchema } from '@hms/validation/legal-catalog'
import { createZodDto } from 'nestjs-zod'

export class LegalAreaResponseDto extends createZodDto(legalAreaSchema) {}
