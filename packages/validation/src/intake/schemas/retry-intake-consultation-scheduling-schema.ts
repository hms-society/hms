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
  .superRefine((data, context) => {
    if (data.modality === ConsultationModality.Virtual && !data.channel) {
      context.addIssue({
        code: 'custom',
        message: 'Virtual channel is required',
        path: ['channel'],
      })
    }

    if (data.modality === ConsultationModality.InPerson && data.channel) {
      context.addIssue({
        code: 'custom',
        message: 'In-person consultation does not have a virtual channel',
        path: ['channel'],
      })
    }
  })
