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
    assignedLawyerId: z.string().optional(),
    startsAt: z.coerce.date().optional(),
    modality: z.enum(ConsultationModality).optional(),
    channel: z.enum(ConsultationChannel).optional(),
    closureNotes: z.string().optional(),
    closureReason: intakeClosureReasonSchema.optional(),
  })
  .superRefine((data, context) => {
    if (data.decision !== 'schedule_consultation') return

    if (!data.assignedLawyerId) {
      context.addIssue({
        code: 'custom',
        message: 'An assigned lawyer is required to schedule a consultation.',
        path: ['assignedLawyerId'],
      })
    }

    if (!data.startsAt) {
      context.addIssue({
        code: 'custom',
        message: 'A start date is required to schedule a consultation.',
        path: ['startsAt'],
      })
    }

    if (!data.modality) {
      context.addIssue({
        code: 'custom',
        message: 'A modality is required to schedule a consultation.',
        path: ['modality'],
      })
    }
  })
