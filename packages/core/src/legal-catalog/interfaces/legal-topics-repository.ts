import type { LegalTopic, LegalTopicCreation, LegalTopicUpdate } from '../domain/entities'

export interface LegalTopicsRepository {
  addMany(topics: LegalTopicCreation[]): Promise<LegalTopic[]>
  findAllByLegalAreaId(legalAreaId: string): Promise<LegalTopic[]>
  findActiveByLegalAreaId(legalAreaId: string): Promise<LegalTopic[]>
  findById(legalTopicId: string): Promise<LegalTopic | undefined>
  findByLegalAreaIdAndName(
    legalAreaId: string,
    name: string,
  ): Promise<LegalTopic | undefined>
  replace(
    legalTopicId: string,
    changes: LegalTopicUpdate,
  ): Promise<LegalTopic | undefined>
  removeAll(): Promise<void>
}
