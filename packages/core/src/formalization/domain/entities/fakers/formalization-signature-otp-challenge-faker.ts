import { faker } from '@faker-js/faker'
import type { FormalizationSignatureOtpChallenge } from '../formalization-signature-otp-challenge'

export function fakeFormalizationSignatureOtpChallenge(overrides: Partial<FormalizationSignatureOtpChallenge> = {}): FormalizationSignatureOtpChallenge {
  const now = new Date('2026-01-01T00:00:00.000Z')
  return {
    id: faker.string.uuid(),
    invitationId: faker.string.uuid(), generation: 1, codeMac: faker.string.hexadecimal({ length: 64, prefix: '' }), channelChoiceId: faker.string.uuid(), destinationFingerprint: faker.string.hexadecimal({ length: 64, prefix: '' }), status: 'active', failedAttempts: 0, issuedAt: now, expiresAt: new Date(now.getTime() + 30 * 60 * 1000),
    ...overrides,
  }
}
