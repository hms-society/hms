import type { FormalizationSignatureOtpChallenge } from '../entities/formalization-signature-otp-challenge'

export type FormalizationSignatureOtpChallengeChanges = {
  readonly status?: FormalizationSignatureOtpChallenge['status']
  readonly failedAttempts?: number
  readonly sentAt?: Date
  readonly expiresAt?: Date
  readonly consumedAt?: Date
}
