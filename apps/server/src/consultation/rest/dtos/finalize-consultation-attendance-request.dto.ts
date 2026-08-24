import { finalizeConsultationAttendanceSchema } from '@hms/validation/consultation'
import { createZodDto } from 'nestjs-zod'

export class FinalizeConsultationAttendanceRequestDto extends createZodDto(
  finalizeConsultationAttendanceSchema,
) {}
