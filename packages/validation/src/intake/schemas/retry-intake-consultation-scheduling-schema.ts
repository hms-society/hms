import {
  ConsultationChannel,
  ConsultationModality,
} from '@hms/core/consultation/domain/structures'
import { z } from 'zod'

export const retryIntakeConsultationSchedulingSchema = z
  .object({
    assignedLawyerId: z.string().uuid(),
    startsAt: z.coerce.date(),
    modality: z.enum(ConsultationModality),
    channel: z.enum(ConsultationChannel).optional(),
  })
  .strict()
