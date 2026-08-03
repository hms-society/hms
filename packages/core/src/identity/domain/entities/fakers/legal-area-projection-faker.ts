import { faker } from '@faker-js/faker'

import type { LegalAreaProjection } from '../legal-area-projection'

export class LegalAreaProjectionFaker {
  static fake(overrides: Partial<LegalAreaProjection> = {}): LegalAreaProjection {
    return {
      id: faker.string.uuid(),
      name: faker.lorem.words(2),
      active: true,
      ...overrides,
    }
  }
}
