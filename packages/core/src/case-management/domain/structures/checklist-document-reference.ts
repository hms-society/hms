import type { ClientDocumentSource } from '../../../document-engine/domain/structures/client-document-source'

export type ChecklistDocumentReference = {
  readonly clientDocumentId: string
  readonly source: ClientDocumentSource
  readonly attachedAt: Date
  readonly attachedBy: string
}
