import { faker } from '@faker-js/faker'

import type { Document } from '../document'

export class DocumentFaker {
  static fake(overrides: Partial<Document> = {}): Document {
    const createdAt = faker.date.past()

    return {
      id: faker.string.uuid(),
      title: faker.lorem.words(3),
      classificacaoAcesso: faker.helpers.arrayElement([
        'INTERNO',
        'CLIENTE',
        'RESTRITO',
        'CONFIDENCIAL',
        'PARCEIRO_LIBERADO',
      ]) as any,
      currentVersionId: undefined,
      createdAt,
      updatedAt: createdAt,
      ...overrides,
    }
  }
}
