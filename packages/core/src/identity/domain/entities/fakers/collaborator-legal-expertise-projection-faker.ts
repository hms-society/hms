import type { CollaboratorLegalExpertiseProjection } from '../collaborator-legal-expertise-projection'
import { LegalAreaProjectionFaker } from './legal-area-projection-faker'
import { LegalTopicProjectionFaker } from './legal-topic-projection-faker'

export class CollaboratorLegalExpertiseProjectionFaker {
  static fake(
    overrides: Partial<CollaboratorLegalExpertiseProjection> = {},
  ): CollaboratorLegalExpertiseProjection {
    return {
      legalArea: LegalAreaProjectionFaker.fake(),
      legalTopics: [LegalTopicProjectionFaker.fake()],
      ...overrides,
    }
  }
}
