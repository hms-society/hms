import { faker } from '@faker-js/faker'

import type { Document } from '../document'

export class DocumentFaker {
  static fake(overrides: Partial<Document> = {}): Document {
    const createdAt = faker.date.past()

    return {
      id: faker.string.uuid(),
      title: faker.lorem.words(3),
      createdAt,
      updatedAt: createdAt,
      ...overrides,
    }
  }
}
