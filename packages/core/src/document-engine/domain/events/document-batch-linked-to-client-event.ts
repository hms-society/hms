import { Event } from '#shared/domain/events/event'

export class DocumentBatchLinkedToClientEvent extends Event<{
  documentBatchId: string
  clientId: string
  linkedByCollaboratorId: string
  occurredAt: Date
}> {
  static readonly _NAME = 'document-engine/document-batch.linked-to-client'

  constructor(payload: DocumentBatchLinkedToClientEvent['payload']) {
    super(DocumentBatchLinkedToClientEvent._NAME, payload)
  }
}
