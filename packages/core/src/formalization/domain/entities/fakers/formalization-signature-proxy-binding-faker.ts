import { faker } from '@faker-js/faker'
import type { FormalizationSignatureProxyBinding } from '../formalization-signature-proxy-binding'

export function fakeFormalizationSignatureProxyBinding(
  overrides: Partial<FormalizationSignatureProxyBinding> = {},
): FormalizationSignatureProxyBinding {
  const now = new Date('2026-01-01T00:00:00.000Z')
  return {
    id: faker.string.uuid(),
    sessionId: faker.string.uuid(),
    requestId: faker.string.uuid(),
    recipientId: faker.string.uuid(),
    aliasHash: faker.string.hexadecimal({ length: 64, prefix: '' }),
    encryptedProviderCredential: faker.string.alphanumeric(32),
    cipherKeyId: faker.string.uuid(),
    providerContractVersion: '2.17.0',
    status: 'active',
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    ...overrides,
  }
}
