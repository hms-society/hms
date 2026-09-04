import type { Entity } from '#shared/domain/entities/entity'

export type FormalizationSignatureProviderRecipientResource = Entity & {
  requestId: string
  providerResourceId: string
  recipientId: string
  providerRecipientId: string
  encryptedSigningCredential: string
  cipherKeyId: string
  lastReconciledAt?: Date
  createdAt: Date
}
