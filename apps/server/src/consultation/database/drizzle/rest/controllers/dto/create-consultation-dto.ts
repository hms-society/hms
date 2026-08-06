import { createConsultationSchema } from '@hms/validation/consultation'
import { createZodDto } from 'nestjs-zod'

export class CreateConsultationDto extends createZodDto(createConsultationSchema) {}