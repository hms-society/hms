import { faker } from '@faker-js/faker'
import type { FormalizationSignatureInvitation } from '../formalization-signature-invitation'

export function fakeFormalizationSignatureInvitation(overrides: Partial<FormalizationSignatureInvitation> = {}): FormalizationSignatureInvitation {
  const now = new Date('2026-01-01T00:00:00.000Z')
  return {
    id: faker.string.uuid(),
    requestId: faker.string.uuid(), recipientId: faker.string.uuid(), tokenHash: faker.string.hexadecimal({ length: 64, prefix: '' }), generation: 1, status: 'active', deliveryStatus: 'pending', expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), createdAt: now,
    ...overrides,
  }
}
