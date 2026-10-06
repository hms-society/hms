import type { Entity } from '#shared/domain/entities/entity'
import type {
  ConsultationCompletedEvent,
  ConsultationLegalContextUpdatedEvent,
} from '../events'

export type ConsultationOutboxEvent = Entity & {
  consultationId: string
  name:
    | typeof ConsultationCompletedEvent._NAME
    | typeof ConsultationLegalContextUpdatedEvent._NAME
  payload: Record<string, string>
  occurredAt: Date
  publishedAt?: Date
}
