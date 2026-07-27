import { intakeSchema } from '@hms/validation/intake'
import { createZodDto } from 'nestjs-zod'

export class IntakeResponseDto extends createZodDto(intakeSchema) {}
