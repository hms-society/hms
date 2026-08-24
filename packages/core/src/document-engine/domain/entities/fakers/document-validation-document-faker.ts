import { faker } from '@faker-js/faker'

import type { DocumentValidationDocument } from '../document-validation'
import { DocumentBatchChannel, DocumentValidationStatus } from '../../structures'

export class DocumentValidationDocumentFaker {
  static fake(
    overrides: Partial<DocumentValidationDocument> = {},
  ): DocumentValidationDocument {
    const receivedAt = faker.date.recent()

    return {
      id: faker.string.uuid(),
      batchId: faker.string.uuid(),
      fileName: `${faker.system.fileName()}.pdf`,
      mimeType: 'application/pdf',
      sizeBytes: faker.number.int({ min: 1024, max: 10 * 1024 * 1024 }),
      storagePath: `documents/${faker.string.uuid()}.pdf`,
      status: DocumentValidationStatus.AwaitingValidation,
      channel: DocumentBatchChannel.InternalUpload,
      sender: faker.internet.email(),
      receivedAt,
      createdAt: receivedAt,
      extractedFields: [],
      missingFields: [],
      ...overrides,
    }
  }
}
