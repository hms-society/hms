import type { Entity } from '#shared/domain/entities/entity'

export type ConsultationOutboxEvent = Entity & {
  consultationId: string
  name:
    | 'consultation/consultation.completed'
    | 'consultation/consultation.legal-context-updated'
  payload: Record<string, string>
  occurredAt: Date
  publishedAt?: Date
}
