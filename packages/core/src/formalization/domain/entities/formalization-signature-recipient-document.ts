import type { Entity } from '#shared/domain/entities/entity'

export type FormalizationSignatureRecipientDocument = Entity & {
  requestId: string
  recipientId: string
  requestDocumentId: string
  createdAt: Date
}
