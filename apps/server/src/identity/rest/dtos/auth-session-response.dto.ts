import { authSessionSchema } from '@hms/validation/identity'
import { createZodDto } from 'nestjs-zod'

export class AuthSessionResponseDto extends createZodDto(authSessionSchema) {}
