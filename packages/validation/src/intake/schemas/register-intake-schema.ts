import { z } from 'zod'

import {
  ConsultationChannel,
  ConsultationModality,
} from '@hms/core/consultation/domain/structures'

import { intakeClosureReasonSchema } from './intake-closure-reason-schema'
import { intakeContactChannelSchema } from './intake-contact-channel-schema'
import { intakeDecisionSchema } from './intake-decision-schema'
import { intakeOriginSchema } from './intake-origin-schema'
import { intakeUrgencySchema } from './intake-urgency-schema'

const optionalCatalogReferenceSchema = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().optional(),
)

export const registerIntakeBaseSchema = z.object({
  clientId: z.string(),
  responsibleId: z.string(),
  origin: intakeOriginSchema,
  contactChannel: intakeContactChannelSchema,
  legalAreaId: optionalCatalogReferenceSchema,
  legalTopicId: optionalCatalogReferenceSchema,
  urgency: intakeUrgencySchema,
  demandNotes: z.string().optional(),
})

export const registerIntakeSchema = registerIntakeBaseSchema
  .extend({
    decision: intakeDecisionSchema,
    assignedLawyerId: z.string().optional(),
    startsAt: z.coerce.date().optional(),
    modality: z.enum(ConsultationModality).optional(),
    channel: z.enum(ConsultationChannel).optional(),
    closureNotes: z.string().optional(),
    closureReason: intakeClosureReasonSchema.optional(),
  })
  .superRefine((data, context) => {
    if (data.decision === 'close_without_contract' && !data.closureReason) {
      context.addIssue({
        code: 'custom',
        message:
          'O motivo do encerramento é obrigatório para encerrar o intake sem contratação.',
        path: ['closureReason'],
      })
    }

    if (data.decision !== 'schedule_consultation') return

    if (!data.assignedLawyerId) {
      context.addIssue({
        code: 'custom',
        message: 'O advogado responsável é obrigatório para agendar uma consulta.',
        path: ['assignedLawyerId'],
      })
    }

    if (!data.startsAt) {
      context.addIssue({
        code: 'custom',
        message: 'A data de início é obrigatória para agendar uma consulta.',
        path: ['startsAt'],
      })
    }

    if (!data.modality) {
      context.addIssue({
        code: 'custom',
        message: 'A modalidade é obrigatória para agendar uma consulta.',
        path: ['modality'],
      })
    }
  })
