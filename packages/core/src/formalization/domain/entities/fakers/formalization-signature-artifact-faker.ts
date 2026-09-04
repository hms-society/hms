import { faker } from '@faker-js/faker'
import type { FormalizationSignatureArtifact } from '../formalization-signature-artifact'

export function fakeFormalizationSignatureArtifact(overrides: Partial<FormalizationSignatureArtifact> = {}): FormalizationSignatureArtifact {
  const now = new Date('2026-01-01T00:00:00.000Z')
  return {
    id: faker.string.uuid(),
    requestId: faker.string.uuid(), requestDocumentId: faker.string.uuid(), kind: 'signed_pdf', privateFileId: faker.string.uuid(), sha256: faker.string.hexadecimal({ length: 64, prefix: '' }), byteCount: 1024, mediaType: 'application/pdf', preservedAt: now,
    ...overrides,
  }
}
