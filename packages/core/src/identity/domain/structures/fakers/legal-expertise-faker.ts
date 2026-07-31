import { faker } from '@faker-js/faker'

import type { LegalExpertise } from '../legal-expertise'

export class LegalExpertiseFaker {
  static fake(overrides: Partial<LegalExpertise> = {}): LegalExpertise {
    return {
      legalAreaId: faker.string.uuid(),
      legalTopicIds: [faker.string.uuid()],
      ...overrides,
    }
  }

  static fakeMany(count = 2): LegalExpertise[] {
    return Array.from({ length: count }, () => LegalExpertiseFaker.fake())
  }
}
