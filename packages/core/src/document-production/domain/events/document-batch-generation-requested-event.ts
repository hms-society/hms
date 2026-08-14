import { Event } from '#shared/domain/events/event'
import type { DocumentGenerationSource } from '../structures'

export class DocumentBatchGenerationRequestedEvent extends Event<{
  documents: readonly {
    documentGenerationId: string
    documentId: string
    documentSpecificationVersionId: string
  }[]
  requestedByCollaboratorId: string
  source: DocumentGenerationSource
  occurredAt: Date
}> {
  static readonly _NAME = 'document-production/document-batch.generation-requested'

  constructor(payload: DocumentBatchGenerationRequestedEvent['payload']) {
    super(DocumentBatchGenerationRequestedEvent._NAME, payload)
  }
}
