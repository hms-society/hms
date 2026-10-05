import {
  ConsultationCompletedEvent,
  ConsultationLegalContextUpdatedEvent,
} from '@hms/core/consultation/domain/events'
import { z } from 'zod'

const uuidSchema = z.string().uuid()
const isoDatetimeSchema = z.iso.datetime({ offset: true })

const consultationCompletedPayloadSchema = z.strictObject({
  consultationId: uuidSchema,
  intakeId: uuidSchema,
  completedBy: uuidSchema,
  occurredAt: isoDatetimeSchema,
})

const consultationLegalContextUpdatedPayloadSchema = z.strictObject({
  consultationId: uuidSchema,
  intakeId: uuidSchema,
  legalAreaId: uuidSchema,
  legalTopicId: uuidSchema,
  updatedBy: uuidSchema,
  occurredAt: isoDatetimeSchema,
})

export const consultationOutboxEventSchema = z.discriminatedUnion('name', [
  z.strictObject({
    id: uuidSchema,
    consultationId: uuidSchema,
    name: z.literal(ConsultationCompletedEvent._NAME),
    payload: consultationCompletedPayloadSchema,
    occurredAt: isoDatetimeSchema,
    publishedAt: isoDatetimeSchema.optional(),
  }),
  z.strictObject({
    id: uuidSchema,
    consultationId: uuidSchema,
    name: z.literal(ConsultationLegalContextUpdatedEvent._NAME),
    payload: consultationLegalContextUpdatedPayloadSchema,
    occurredAt: isoDatetimeSchema,
    publishedAt: isoDatetimeSchema.optional(),
  }),
])

export type ConsultationOutboxEvent = z.infer<typeof consultationOutboxEventSchema>
