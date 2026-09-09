import type { FormalizationSignatureInvitation } from '../entities/formalization-signature-invitation'
import type { FormalizationSignatureInvitationStatus } from './formalization-signature-invitation-status'

export type FormalizationSignatureInvitationChanges = {
  readonly status?: FormalizationSignatureInvitationStatus
  readonly deliveryStatus?: FormalizationSignatureInvitation['deliveryStatus']
  readonly communicationMessageId?: string
  readonly deliveredAt?: Date
  readonly consumedAt?: Date
  readonly revokedAt?: Date
  readonly revocationReason?: string
}
