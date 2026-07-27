import type { DocumentBatchDiscardReason } from '../structures'
import { Event } from '#shared/domain/events/event'

export class DocumentBatchDiscardedEvent extends Event<{
  documentBatchId: string
  reason: DocumentBatchDiscardReason
  discardedByCollaboratorId: string
  occurredAt: Date
}> {
  static readonly _NAME = 'document-engine/document-batch.discarded'

  constructor(payload: DocumentBatchDiscardedEvent['payload']) {
    super(DocumentBatchDiscardedEvent._NAME, payload)
  }
}
