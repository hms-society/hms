import { faker } from '@faker-js/faker'

import type { PackageDocument } from '../package-document'

export class PackageDocumentFaker {
  static fake(overrides: Partial<PackageDocument> = {}): PackageDocument {
    const createdAt = faker.date.past()

    return {
      id: faker.string.uuid(),
      documentPackageId: faker.string.uuid(),
      documentId: faker.string.uuid(),
      documentSpecificationId: faker.string.uuid(),
      createdAt,
      updatedAt: createdAt,
      ...overrides,
    }
  }
}
