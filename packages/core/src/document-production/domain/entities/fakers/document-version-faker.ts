import { faker } from '@faker-js/faker'

import type { DocumentVersion } from '../document-version'

export function fakeDocumentVersion(
  overrides: Partial<DocumentVersion> = {},
): DocumentVersion {
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
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }
}
