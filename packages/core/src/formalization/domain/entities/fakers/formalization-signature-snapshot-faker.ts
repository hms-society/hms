import { faker } from '@faker-js/faker'
import type { FormalizationSignatureSnapshot } from '../formalization-signature-snapshot'

export function fakeFormalizationSignatureSnapshot(overrides: Partial<FormalizationSignatureSnapshot> = {}): FormalizationSignatureSnapshot {
  const now = new Date('2026-01-01T00:00:00.000Z')
  return {
    id: faker.string.uuid(),
    formalizationId: faker.string.uuid(), formalizationVersion: 1, signatureConfigurationVersion: 1, snapshotHash: faker.string.hexadecimal({ length: 64, prefix: '' }), createdBy: faker.string.uuid(), createdAt: now,
    ...overrides,
  }
}
