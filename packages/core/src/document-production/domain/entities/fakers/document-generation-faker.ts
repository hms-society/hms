import { faker } from '@faker-js/faker'

import type { DocumentGeneration } from '../document-generation'

export class DocumentGenerationFaker {
  static fake(overrides: Partial<DocumentGeneration> = {}): DocumentGeneration {
    const createdAt = faker.date.past()

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
      createdAt,
      updatedAt: createdAt,
      ...overrides,
    }
  }
}
