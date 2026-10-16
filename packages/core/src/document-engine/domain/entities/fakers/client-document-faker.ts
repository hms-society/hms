import { faker } from '@faker-js/faker'
import type { ClientDocument } from '../client-document'
export class ClientDocumentFaker {
  static fake(overrides: Partial<ClientDocument> = {}): ClientDocument {
    return {
      id: faker.string.uuid(),
      clientId: faker.string.uuid(),
      name: 'Comprovante.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
      createdAt: faker.date.recent(),
      source: { kind: 'received_file', fileId: faker.string.uuid() },
      ...overrides,
    }
  }
  static fakeMany(count = 10): ClientDocument[] {
    return Array.from({ length: count }, () => ClientDocumentFaker.fake())
  }
}
