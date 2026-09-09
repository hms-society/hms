import type { FormalizationSignatureOtpSendAttempt } from '../entities/formalization-signature-otp-send-attempt'

export type FormalizationSignatureOtpSendAttemptChanges = {
  readonly status?: FormalizationSignatureOtpSendAttempt['status']
  readonly providerMessageId?: string
  readonly attempts?: number
  readonly nextAttemptAt?: Date
  readonly deliveredAt?: Date
}
