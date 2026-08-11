import { createZodDto } from 'nestjs-zod'
import { completeConsultationSchema } from '@hms/validation/consultation'

export class CompleteConsultationDto extends createZodDto(completeConsultationSchema) {}