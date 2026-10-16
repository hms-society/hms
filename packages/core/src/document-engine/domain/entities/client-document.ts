import type { Entity } from '#shared/domain/entities/entity'
import type { ClientDocumentSource } from '../structures/client-document-source'
export type ClientDocument = Entity & {
  clientId: string
  name: string
  mimeType: string
  sizeBytes?: number
  createdAt: Date
  source: ClientDocumentSource
}
