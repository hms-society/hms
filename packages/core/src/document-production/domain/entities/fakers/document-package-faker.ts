import { faker } from '@faker-js/faker'

import type { DocumentPackage } from '../document-package'

export class DocumentPackageFaker {
  static fake(overrides: Partial<DocumentPackage> = {}): DocumentPackage {
    const createdAt = faker.date.past()

    return {
      id: faker.string.uuid(),
      context: { type: 'consultation', consultationId: faker.string.uuid() },
      documents: [],
      createdAt,
      updatedAt: createdAt,
      ...overrides,
    }
  }
}
