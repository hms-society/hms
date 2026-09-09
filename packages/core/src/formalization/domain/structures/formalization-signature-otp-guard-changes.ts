export type FormalizationSignatureOtpGuardChanges = {
  readonly failedAttempts?: number
  readonly rollingWindowStartedAt?: Date
  readonly sendsInWindow?: number
  readonly lastSentAt?: Date
  readonly lockedUntil?: Date
  readonly updatedAt: Date
}
