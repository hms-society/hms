import { faker } from '@faker-js/faker'
import type { LegalTopic } from '../legal-topic'

export class LegalTopicFaker {
  static fake(overrides: Partial<LegalTopic> = {}): LegalTopic {
    return {
      id: faker.string.uuid(),
      legalAreaId: faker.string.uuid(),
      name: faker.lorem.words(2),
      active: true,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    }
  }

  static fakeMany(count = 10): LegalTopic[] {
    return Array.from({ length: count }, () => LegalTopicFaker.fake())
  }
}
