import { faker } from '@faker-js/faker'
import type { FormalizationSignatureProvisioningAttempt } from '../formalization-signature-provisioning-attempt'

export function fakeFormalizationSignatureProvisioningAttempt(
  overrides: Partial<FormalizationSignatureProvisioningAttempt> = {},
): FormalizationSignatureProvisioningAttempt {
  const now = new Date('2026-01-01T00:00:00.000Z')
  return {
    id: faker.string.uuid(),
    requestId: faker.string.uuid(),
    attemptToken: faker.string.uuid(),
    status: 'pending',
    attempts: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}
