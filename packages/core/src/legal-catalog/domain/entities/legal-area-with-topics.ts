import type { LegalArea } from './legal-area'
import type { LegalTopic } from './legal-topic'

export type LegalAreaWithTopics = LegalArea & {
  topics: LegalTopic[]
}
