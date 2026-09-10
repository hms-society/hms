import { faker } from '@faker-js/faker'
import type { FormalizationSignatureCancellationAttempt } from '../formalization-signature-cancellation-attempt'

export function fakeFormalizationSignatureCancellationAttempt(overrides: Partial<FormalizationSignatureCancellationAttempt> = {}): FormalizationSignatureCancellationAttempt {
  const now = new Date('2026-01-01T00:00:00.000Z')
  return {
    id: faker.string.uuid(),
    requestId: faker.string.uuid(), attemptToken: faker.string.uuid(), status: 'pending', attempts: 0, requestedBy: faker.string.uuid(), requestedAt: now, updatedAt: now,
    ...overrides,
  }
}
