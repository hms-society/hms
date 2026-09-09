import type { Entity } from '#shared/domain/entities/entity'
import type { FormalizationSignatureInvitationStatus } from '../structures/formalization-signature-invitation-status'

export type FormalizationSignatureInvitation = Entity & {
  requestId: string
  recipientId: string
  tokenHash: string
  generation: number
  status: FormalizationSignatureInvitationStatus
  deliveryStatus: 'pending' | 'delivered' | 'failed'
  expiresAt: Date
  communicationMessageId?: string
  deliveredAt?: Date
  consumedAt?: Date
  revokedAt?: Date
  revocationReason?: string
  createdAt: Date
}
