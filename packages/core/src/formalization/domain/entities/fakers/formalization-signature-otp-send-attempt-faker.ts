import { faker } from '@faker-js/faker'
import type { FormalizationSignatureOtpSendAttempt } from '../formalization-signature-otp-send-attempt'

export function fakeFormalizationSignatureOtpSendAttempt(overrides: Partial<FormalizationSignatureOtpSendAttempt> = {}): FormalizationSignatureOtpSendAttempt {
  return {
    id: faker.string.uuid(),
    challengeId: faker.string.uuid(), encryptedPayload: faker.string.alphanumeric(32), cipherKeyId: faker.string.uuid(), status: 'pending', attempts: 0,
    ...overrides,
  }
}
