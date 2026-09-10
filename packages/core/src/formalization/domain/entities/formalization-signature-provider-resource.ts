import type { Entity } from '#shared/domain/entities/entity'

export type FormalizationSignatureProviderResource = Entity & {
  requestId: string
  provider: 'documenso'
  providerContractVersion: string
  providerEnvelopeId: string
  providerExternalId: string
  idempotencyKey: string
  lastReconciledAt?: Date
  createdAt: Date
}
