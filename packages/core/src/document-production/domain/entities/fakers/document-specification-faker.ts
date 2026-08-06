import { faker } from '@faker-js/faker'

import type { DocumentSpecification } from '../document-specification'

export function fakeDocumentSpecification(
  overrides: Partial<DocumentSpecification> = {},
): DocumentSpecification {
  return {
    id: faker.string.uuid(),
    name: 'Modelo de contrato',
    description: 'Descrição do modelo',
    application: {
      scope: 'global',
      moment: 'consultation',
    },
    isRequired: false,
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
    variables: [],
    status: 'unavailable',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }
}
