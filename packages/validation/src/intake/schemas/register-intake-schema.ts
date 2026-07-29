import { z } from 'zod'

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

export const registerIntakeSchema = registerIntakeBaseSchema.extend({
  decision: intakeDecisionSchema,
  closureNotes: z.string().optional(),
  closureReason: intakeClosureReasonSchema.optional(),
})
