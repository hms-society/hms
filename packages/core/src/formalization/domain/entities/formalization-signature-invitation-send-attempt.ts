import type { Entity } from '#shared/domain/entities/entity'

export type FormalizationSignatureInvitationSendAttempt = Entity & {
  invitationId: string
  encryptedPayload: string
  cipherKeyId: string
  status: 'pending' | 'delivered' | 'failed'
  communicationMessageId?: string
  attempts: number
  nextAttemptAt?: Date
  deliveredAt?: Date
  createdAt: Date
  updatedAt: Date
}
