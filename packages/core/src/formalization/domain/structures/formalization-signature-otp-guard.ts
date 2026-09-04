export type FormalizationSignatureOtpGuard = {
  invitationId: string
  failedAttempts: number
  rollingWindowStartedAt: Date
  sendsInWindow: number
  lastSentAt?: Date
  lockedUntil?: Date
  updatedAt: Date
  version: number
}
