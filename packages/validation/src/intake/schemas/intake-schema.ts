import { z } from 'zod'

import { intakeClosureReasonSchema } from './intake-closure-reason-schema'
import { intakeContactChannelSchema } from './intake-contact-channel-schema'
import { intakeOriginSchema } from './intake-origin-schema'
import { intakeStatusSchema } from './intake-status-schema'
import { intakeUrgencySchema } from './intake-urgency-schema'

export const intakeSchema = z.object({
  id: z.string(),
  sequenceNumber: z.number().int(),
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
  status: intakeStatusSchema,
  closureReason: intakeClosureReasonSchema.optional(),
  closureNotes: z.string().optional(),
  closedAt: z.iso.datetime().optional(),
  version: z.number().int(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const intakesSchema = z.array(intakeSchema)
