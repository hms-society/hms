import type { FormalizationSignatureInvitationStatus } from './formalization-signature-invitation-status'
import type { FormalizationSignatureChannelKind } from './formalization-signature-channel-kind'
import type { FormalizationSignatureRecipientKind } from './formalization-signature-recipient-kind'
import type { FormalizationSignatureRecipientStatus } from './formalization-signature-recipient-status'

export type FormalizationSignatureTrackingSignatory = {
  readonly recipientId: string
  readonly recipientVersion: number
  readonly displayName: string
  readonly actorKind: FormalizationSignatureRecipientKind
  readonly deliveryChannel: FormalizationSignatureChannelKind
  readonly status: FormalizationSignatureRecipientStatus
  readonly invitationGeneration?: number
  readonly invitationStatus?: FormalizationSignatureInvitationStatus
  readonly invitationDeliveryStatus?: 'pending' | 'delivered' | 'failed'
  readonly invitedAt?: Date
  readonly submittedAt?: Date
  readonly confirmedAt?: Date
  readonly terminalAt?: Date
  readonly protocolNumber?: string
  readonly canResend: boolean
}
