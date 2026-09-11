import { faker } from '@faker-js/faker'
import type { FormalizationSignatureProviderResource } from '../formalization-signature-provider-resource'

export function fakeFormalizationSignatureProviderResource(
  overrides: Partial<FormalizationSignatureProviderResource> = {},
): FormalizationSignatureProviderResource {
  const now = new Date('2026-01-01T00:00:00.000Z')
  return {
    id: faker.string.uuid(),
    requestId: faker.string.uuid(),
    provider: 'documenso',
    providerContractVersion: '2.17.0',
    providerEnvelopeId: faker.string.uuid(),
    providerExternalId: faker.string.uuid(),
    idempotencyKey: faker.string.uuid(),
    createdAt: now,
    ...overrides,
  }
}
