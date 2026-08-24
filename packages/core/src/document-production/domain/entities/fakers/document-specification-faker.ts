import { faker } from '@faker-js/faker'

import type { DocumentSpecification } from '../document-specification'

export class DocumentSpecificationFaker {
  static fake(overrides: Partial<DocumentSpecification> = {}): DocumentSpecification {
    const createdAt = faker.date.past()

    return {
      id: faker.string.uuid(),
      name: 'Modelo de contrato',
      description: 'Descrição do modelo',
      application: {
        scope: 'global',
        moment: 'consultation',
      },
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
      variables: [],
      status: 'unavailable',
      createdAt,
      updatedAt: createdAt,
      ...overrides,
    }
  }
}
