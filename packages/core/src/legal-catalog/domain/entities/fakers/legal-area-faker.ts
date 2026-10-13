import { faker } from '@faker-js/faker'
import type { LegalArea } from '../legal-area'

export class LegalAreaFaker {
  static fake(overrides: Partial<LegalArea> = {}): LegalArea {
    return {
      id: faker.string.uuid(),
      name: faker.lorem.words(2),
      active: true,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    }
  }

  static fakeMany(count = 10): LegalArea[] {
    return Array.from({ length: count }, () => LegalAreaFaker.fake())
  }
}
