import type { Entity } from '#shared/domain/entities/entity'
import type { FormalizationSignatureAccessStatus } from '../structures/formalization-signature-access-status'

export type FormalizationSignatureProxyBinding = Entity & {
  sessionId: string
  requestId: string
  recipientId: string
  aliasHash: string
  encryptedProviderCredential: string
  cipherKeyId: string
  providerContractVersion: string
  status: FormalizationSignatureAccessStatus
  expiresAt: Date
  revokedAt?: Date
  revocationReason?: string
}
