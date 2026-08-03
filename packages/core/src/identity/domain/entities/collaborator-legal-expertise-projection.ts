import type { LegalAreaProjection } from './legal-area-projection'
import type { LegalTopicProjection } from './legal-topic-projection'

export type CollaboratorLegalExpertiseProjection = {
  readonly legalArea: LegalAreaProjection
  readonly legalTopics: readonly LegalTopicProjection[]
}
