import {
  legalAreaInputSchema,
  legalAreaUpdateSchema,
} from '@hms/validation/legal-catalog'
import { createZodDto } from 'nestjs-zod'

export class LegalAreaInputDto extends createZodDto(legalAreaInputSchema) {}

export class LegalAreaUpdateDto extends createZodDto(legalAreaUpdateSchema) {}
