import type { FormalizationSignatureInvitationSendAttempt } from '../entities/formalization-signature-invitation-send-attempt'

export type FormalizationSignatureInvitationSendAttemptChanges = {
  readonly status?: FormalizationSignatureInvitationSendAttempt['status']
  readonly communicationMessageId?: string
  readonly attempts?: number
  readonly nextAttemptAt?: Date
  readonly deliveredAt?: Date
  readonly updatedAt: Date
}
