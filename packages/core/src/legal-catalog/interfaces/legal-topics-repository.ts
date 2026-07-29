import type { LegalTopic, LegalTopicCreation } from '../domain/entities'

export interface LegalTopicsRepository {
  addMany(topics: LegalTopicCreation[]): Promise<LegalTopic[]>
  findActiveByLegalAreaId(legalAreaId: string): Promise<LegalTopic[]>
  removeAll(): Promise<void>
}
