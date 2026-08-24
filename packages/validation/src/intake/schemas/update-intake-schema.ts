import { z } from 'zod'

import { intakeContactChannelSchema } from './intake-contact-channel-schema'
import { intakeOriginSchema } from './intake-origin-schema'
import { intakeUrgencySchema } from './intake-urgency-schema'

const optionalCatalogReferenceSchema = z.preprocess(
  (value) => (value === '' ? null : value),
  z.string().nullable().optional(),
)

export const updateIntakeSchema = z.object({
  expectedVersion: z.number().int().positive(),
  updatedBy: z.string().min(1),
  responsibleId: z.string().min(1),
  origin: intakeOriginSchema,
  contactChannel: intakeContactChannelSchema,
  legalAreaId: optionalCatalogReferenceSchema,
  legalTopicId: optionalCatalogReferenceSchema,
  urgency: intakeUrgencySchema,
  demandNotes: z.string().trim().max(2000).optional(),
})

export type UpdateIntakeFormData = z.infer<typeof updateIntakeSchema>
