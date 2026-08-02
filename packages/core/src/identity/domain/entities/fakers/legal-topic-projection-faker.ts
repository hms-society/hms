import { faker } from '@faker-js/faker'

import type { LegalTopicProjection } from '../legal-topic-projection'

export class LegalTopicProjectionFaker {
  static fake(overrides: Partial<LegalTopicProjection> = {}): LegalTopicProjection {
    return {
      id: faker.string.uuid(),
      name: faker.lorem.words(3),
      active: true,
      ...overrides,
    }
  }
}
