import { faker } from '@faker-js/faker'
import type { FormalizationSignatureProtocol } from '../formalization-signature-protocol'

export function fakeFormalizationSignatureProtocol(overrides: Partial<FormalizationSignatureProtocol> = {}): FormalizationSignatureProtocol {
  const now = new Date('2026-01-01T00:00:00.000Z')
  return {
    id: faker.string.uuid(),
    requestId: faker.string.uuid(), recipientId: faker.string.uuid(), number: `PRO-${faker.string.numeric(8)}`, artifactSetHash: faker.string.hexadecimal({ length: 64, prefix: '' }), confirmedAt: now,
    ...overrides,
  }
}
