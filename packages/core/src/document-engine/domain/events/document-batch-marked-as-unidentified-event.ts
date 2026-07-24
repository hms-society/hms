import { Event } from '#shared/domain/events/event'

export class DocumentBatchMarkedAsUnidentifiedEvent extends Event<{
  documentBatchId: string
  markedByCollaboratorId: string
  occurredAt: Date
}> {
  static readonly _NAME = 'document-engine/document-batch.marked-as-unidentified'

  constructor(payload: DocumentBatchMarkedAsUnidentifiedEvent['payload']) {
    super(DocumentBatchMarkedAsUnidentifiedEvent._NAME, payload)
  }
}
