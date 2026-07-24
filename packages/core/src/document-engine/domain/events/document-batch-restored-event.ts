import { Event } from '#shared/domain/events/event'

export class DocumentBatchRestoredEvent extends Event<{
  documentBatchId: string
  restoredByCollaboratorId: string
  occurredAt: Date
}> {
  static readonly _NAME = 'document-engine/document-batch.restored'

  constructor(payload: DocumentBatchRestoredEvent['payload']) {
    super(DocumentBatchRestoredEvent._NAME, payload)
  }
}
