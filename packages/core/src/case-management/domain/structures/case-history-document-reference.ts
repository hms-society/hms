import type { ClientDocumentSource } from '../../../document-engine/domain/structures/client-document-source'
export type CaseHistoryDocumentReference = {
  readonly clientDocumentId: string
  readonly source: ClientDocumentSource
  readonly name: string
}
