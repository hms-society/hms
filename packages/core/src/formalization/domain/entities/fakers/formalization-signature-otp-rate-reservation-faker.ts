import { faker } from '@faker-js/faker'
import type { FormalizationSignatureOtpRateReservation } from '../formalization-signature-otp-rate-reservation'

export function fakeFormalizationSignatureOtpRateReservation(overrides: Partial<FormalizationSignatureOtpRateReservation> = {}): FormalizationSignatureOtpRateReservation {
  const now = new Date('2026-01-01T00:00:00.000Z')
  return {
    id: faker.string.uuid(),
    invitationId: faker.string.uuid(), sourceIpHash: faker.string.hexadecimal({ length: 64, prefix: '' }), reservedAt: now,
    ...overrides,
  }
}
