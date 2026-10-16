import { faker } from '@faker-js/faker'
import type { ClientDocumentUpload } from '../client-document-upload'
export class ClientDocumentUploadFaker {
  static fake(overrides: Partial<ClientDocumentUpload> = {}): ClientDocumentUpload {
    const id = faker.string.uuid()
    return {
      id,
      caseId: faker.string.uuid(),
      checklistItemId: faker.string.uuid(),
      clientId: faker.string.uuid(),
      actorId: faker.string.uuid(),
      operationId: faker.string.uuid(),
      name: 'Comprovante.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 5,
      storagePath: `checklist-uploads/${id}`,
      createdAt: faker.date.recent(),
      expiresAt: faker.date.soon(),
      ...overrides,
    }
  }
  static fakeMany(count = 10): ClientDocumentUpload[] {
    return Array.from({ length: count }, () => ClientDocumentUploadFaker.fake())
  }
}
