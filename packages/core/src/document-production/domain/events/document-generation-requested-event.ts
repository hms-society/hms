import { Event } from '#shared/domain/events/event'
import type { DocumentGenerationSource } from '../structures'

export class DocumentGenerationRequestedEvent extends Event<{
  documentGenerationId: string
  documentId: string
  documentSpecificationVersionId: string
  requestedByCollaboratorId: string
  source: DocumentGenerationSource
  occurredAt: Date
}> {
  static readonly _NAME = 'document-production/document.generation-requested'

  constructor(payload: DocumentGenerationRequestedEvent['payload']) {
    super(DocumentGenerationRequestedEvent._NAME, payload)
  }
}
