import { faker } from '@faker-js/faker'

import type { DocumentGeneration } from '../document-generation'

export function fakeDocumentGeneration(
  overrides: Partial<DocumentGeneration> = {},
): DocumentGeneration {
  return {
    id: faker.string.uuid(),
    documentId: faker.string.uuid(),
    documentSpecificationVersionId: faker.string.uuid(),
    requestedByCollaboratorId: faker.string.uuid(),
    source: {
      type: 'consultation',
      id: faker.string.uuid(),
      data: { clientName: faker.person.fullName() },
    },
    template: {
      name: 'Procuração',
      content: {
        type: 'doc',
        content: [{ type: 'paragraph' }],
      },
      variables: [],
    },
    status: 'pending',
    attemptsCount: 0,
    findings: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }
}
