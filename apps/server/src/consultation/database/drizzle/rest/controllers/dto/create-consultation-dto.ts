import { createZodDto } from 'nestjs-zod'
import { createConsultationSchema } from '@hms/validation/consultation'

export class CreateConsultationDto extends createZodDto(createConsultationSchema) {}