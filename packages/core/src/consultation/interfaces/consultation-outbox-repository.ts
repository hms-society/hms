import type { ConsultationOutboxEvent } from '../domain/entities'

export interface ConsultationOutboxRepository {
  add(event: ConsultationOutboxEvent): Promise<ConsultationOutboxEvent>
  listPending(limit: number): Promise<readonly ConsultationOutboxEvent[]>
  markPublished(id: string, publishedAt: Date): Promise<boolean>
}
