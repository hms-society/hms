import { createZodDto } from 'nestjs-zod'
import { updateClientQualificationSchema } from '@hms/validation/consultation'

export class UpdateClientQualificationDto extends createZodDto(
  updateClientQualificationSchema,
) {}
