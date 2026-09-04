import { faker } from '@faker-js/faker'
import type { FormalizationSignatureRequestDocument } from '../formalization-signature-request-document'

export function fakeFormalizationSignatureRequestDocument(overrides: Partial<FormalizationSignatureRequestDocument> = {}): FormalizationSignatureRequestDocument {
  const now = new Date('2026-01-01T00:00:00.000Z')
  return {
    id: faker.string.uuid(),
    requestId: faker.string.uuid(), sourceDocumentId: faker.string.uuid(), sourceDocumentVersionId: faker.string.uuid(), signaturePreviewId: faker.string.uuid(), unsignedPrivateFileId: faker.string.uuid(), unsignedSha256: faker.string.hexadecimal({ length: 64, prefix: '' }), byteCount: 1024, pageCount: 1, position: 1, status: 'pending', version: 1, createdAt: now, updatedAt: now,
    ...overrides,
  }
}
