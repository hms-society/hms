import { clientDetailsSchema } from '@hms/validation/identity'
import { createZodDto } from 'nestjs-zod'

export class ClientDetailsResponseDto extends createZodDto(clientDetailsSchema) {}
