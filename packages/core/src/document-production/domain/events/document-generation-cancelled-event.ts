import { Event } from '#shared/domain/events/event'

export class DocumentGenerationCancelledEvent extends Event<{
  documentGenerationId: string
  occurredAt: Date
}> {
  static readonly _NAME = 'document-production/document.generation-cancelled'

  constructor(payload: DocumentGenerationCancelledEvent['payload']) {
    super(DocumentGenerationCancelledEvent._NAME, payload)
  }
}
