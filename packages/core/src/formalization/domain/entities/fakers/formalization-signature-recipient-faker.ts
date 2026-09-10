import { faker } from '@faker-js/faker'
import type { FormalizationSignatureRecipient } from '../formalization-signature-recipient'

export function fakeFormalizationSignatureRecipient(
  overrides: Partial<FormalizationSignatureRecipient> = {},
): FormalizationSignatureRecipient {
  const now = new Date('2026-01-01T00:00:00.000Z')
  return {
    id: faker.string.uuid(),
    requestId: faker.string.uuid(),
    signatoryId: faker.string.uuid(),
    personId: faker.string.uuid(),
    actorKind: 'client',
    displayNameSnapshot: faker.person.fullName(),
    deliveryChannel: 'email',
    status: 'invited',
    version: 1,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}
