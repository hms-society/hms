import { createZodDto } from 'nestjs-zod'
import { registerWabaAccountSchema } from '@hms/validation/communication'

export class RegisterWabaAccountDto extends createZodDto(registerWabaAccountSchema) {}
