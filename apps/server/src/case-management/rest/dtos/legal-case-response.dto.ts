import { legalCaseSchema } from '@hms/validation/case-management'
import { createZodDto } from 'nestjs-zod'

export class LegalCaseResponseDto extends createZodDto(legalCaseSchema) {}
