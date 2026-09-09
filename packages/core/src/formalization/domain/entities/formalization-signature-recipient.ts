import type { Entity } from '#shared/domain/entities/entity'
import type { FormalizationSignatureChannelKind } from '../structures/formalization-signature-channel-kind'
import type { FormalizationSignatureRecipientKind } from '../structures/formalization-signature-recipient-kind'
import type { FormalizationSignatureRecipientStatus } from '../structures/formalization-signature-recipient-status'

export type FormalizationSignatureRecipient = Entity & {
  requestId: string
  signatoryId: string
  personId: string
  actorKind: FormalizationSignatureRecipientKind
  displayNameSnapshot: string
  deliveryChannel: FormalizationSignatureChannelKind
  status: FormalizationSignatureRecipientStatus
  version: number
  invitedAt?: Date
  submittedAt?: Date
  submissionObservationId?: string
  confirmedAt?: Date
  terminalAt?: Date
  createdAt: Date
  updatedAt: Date
}
