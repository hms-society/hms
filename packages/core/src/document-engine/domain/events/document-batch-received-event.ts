import type { DocumentBatchChannel } from '../structures'
import { Event } from '#shared/domain/events/event'

export class DocumentBatchReceivedEvent extends Event<{
  documentBatchId: string
  channel: DocumentBatchChannel
  occurredAt: Date
}> {
  static readonly _NAME = 'document-engine/document-batch.received'

  constructor(payload: DocumentBatchReceivedEvent['payload']) {
    super(DocumentBatchReceivedEvent._NAME, payload)
  }
}
