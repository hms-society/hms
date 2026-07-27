import { Event } from '#shared/domain/events/event'

import type { PackageDocumentStatus } from '../structures'

export class DocumentAiGenerationRequestedEvent extends Event<{
  packageDocumentId: string
  previousStatus: PackageDocumentStatus
  requestedByCollaboratorId: string
  occurredAt: Date
}> {
  static readonly _NAME = 'document-production/document.ai-generation-requested'

  constructor(payload: DocumentAiGenerationRequestedEvent['payload']) {
    super(DocumentAiGenerationRequestedEvent._NAME, payload)
  }
}
