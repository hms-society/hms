import type { Entity } from '#shared/domain/entities/entity'

export type FormalizationSignatureProviderDocumentResource = Entity & {
  requestId: string
  providerResourceId: string
  requestDocumentId: string
  providerEnvelopeItemId: string
  createdAt: Date
}
