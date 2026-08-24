import { ConsultationModality } from '@hms/core/consultation/domain/structures'
import { z } from 'zod'

export const createConsultationSchema = z.object({
  id: z.string().uuid(),
  appointmentId: z.string().uuid(),
  intakeId: z.string().uuid().optional(),
  clientId: z.string().uuid(),
  assignedLawyerId: z.string().uuid(),
  responsibleId: z.string().uuid().optional(),
  legalAreaId: z.string().uuid().optional(),
  legalTopicId: z.string().uuid().optional(),
  modality: z.nativeEnum(ConsultationModality),
  channel: z.string().optional(),
})

export type CreateConsultationDto = z.infer<typeof createConsultationSchema>
