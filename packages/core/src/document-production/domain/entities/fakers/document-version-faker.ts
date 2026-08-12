import { faker } from '@faker-js/faker'

import type { DocumentVersion } from '../document-version'

export class DocumentVersionFaker {
  static fake(overrides: Partial<DocumentVersion> = {}): DocumentVersion {
    return {
      id: faker.string.uuid(),
      documentId: faker.string.uuid(),
      documentGenerationId: faker.string.uuid(),
      fileId: faker.string.uuid(),
      versionNumber: 1,
      source: 'ai',
      content: { type: 'doc' },
      pendingMarkers: [],
      createdByCollaboratorId: faker.string.uuid(),
      createdAt: faker.date.past(),
      ...overrides,
    }
  }
}
