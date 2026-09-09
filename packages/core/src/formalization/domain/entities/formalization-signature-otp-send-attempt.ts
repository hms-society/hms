import type { Entity } from '#shared/domain/entities/entity'

export type FormalizationSignatureOtpSendAttempt = Entity & {
  challengeId: string
  encryptedPayload: string
  cipherKeyId: string
  status: 'pending' | 'delivered' | 'failed'
  providerMessageId?: string
  attempts: number
  nextAttemptAt?: Date
  deliveredAt?: Date
}
