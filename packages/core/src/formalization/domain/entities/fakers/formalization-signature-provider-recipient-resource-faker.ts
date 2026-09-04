import { faker } from '@faker-js/faker'
import type { FormalizationSignatureProviderRecipientResource } from '../formalization-signature-provider-recipient-resource'

export function fakeFormalizationSignatureProviderRecipientResource(overrides: Partial<FormalizationSignatureProviderRecipientResource> = {}): FormalizationSignatureProviderRecipientResource {
  const now = new Date('2026-01-01T00:00:00.000Z')
  return {
    id: faker.string.uuid(),
    requestId: faker.string.uuid(), providerResourceId: faker.string.uuid(), recipientId: faker.string.uuid(), providerRecipientId: faker.string.uuid(), encryptedSigningCredential: faker.string.alphanumeric(32), cipherKeyId: faker.string.uuid(), createdAt: now,
    ...overrides,
  }
}
