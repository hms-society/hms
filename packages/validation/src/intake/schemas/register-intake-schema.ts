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

export const registerIntakeBaseSchema = z.object({
  clientId: z.string(),
  responsibleId: z.string(),
  createdBy: z.string(),
  updatedBy: z.string(),
  origin: intakeOriginSchema,
  contactChannel: intakeContactChannelSchema,
  legalAreaId: z.string(),
  legalTopicId: z.string(),
  urgency: intakeUrgencySchema,
  demandNotes: z.string().optional(),
})

export const registerIntakeSchema = registerIntakeBaseSchema
  .extend({
    decision: intakeDecisionSchema,
    assignedLawyerId: z.string().uuid().optional(),
    startsAt: z.coerce.date().optional(),
    modality: z.enum(ConsultationModality).optional(),
    channel: z.enum(ConsultationChannel).optional(),
    closureNotes: z.string().optional(),
    closureReason: intakeClosureReasonSchema.optional(),
  })
  .superRefine((data, context) => {
    if (data.decision !== 'schedule_consultation') return

    for (const field of ['assignedLawyerId', 'startsAt', 'modality'] as const) {
      if (!data[field]) {
        context.addIssue({
          code: 'custom',
          message: 'Required scheduling field',
          path: [field],
        })
      }
    }

    if (data.modality === ConsultationModality.Virtual && !data.channel) {
      context.addIssue({
        code: 'custom',
        message: 'Virtual channel is required',
        path: ['channel'],
      })
    }
  })
