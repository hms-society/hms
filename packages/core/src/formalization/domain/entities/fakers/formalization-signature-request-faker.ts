import { faker } from '@faker-js/faker'
import type { FormalizationSignatureRequest } from '../formalization-signature-request'

export function fakeFormalizationSignatureRequest(
  overrides: Partial<FormalizationSignatureRequest> = {},
): FormalizationSignatureRequest {
  const now = new Date('2026-01-01T00:00:00.000Z')
  return {
    id: faker.string.uuid(),
    formalizationId: faker.string.uuid(),
    signatureConfigurationVersion: 1,
    snapshotId: faker.string.uuid(),
    confirmationKeyHash: faker.string.hexadecimal({ length: 64, prefix: '' }),
    status: 'provisioning',
    version: 1,
    createdBy: faker.string.uuid(),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}
