import { faker } from '@faker-js/faker'
import type { FormalizationSignatureWebhookReceipt } from '../formalization-signature-webhook-receipt'

export function fakeFormalizationSignatureWebhookReceipt(overrides: Partial<FormalizationSignatureWebhookReceipt> = {}): FormalizationSignatureWebhookReceipt {
  const now = new Date('2026-01-01T00:00:00.000Z')
  return {
    id: faker.string.uuid(),
    dedupeKey: faker.string.uuid(), hintKind: 'observation', encryptedHint: faker.string.alphanumeric(32), cipherKeyId: faker.string.uuid(), status: 'pending', receivedAt: now, attempts: 0,
    ...overrides,
  }
}
