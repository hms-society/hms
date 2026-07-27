import { Event } from '#shared/domain/events/event'

import type { PackageDocumentStatus } from '../structures'

export class DocumentManualWritingStartedEvent extends Event<{
  packageDocumentId: string
  previousStatus: PackageDocumentStatus
  startedByCollaboratorId: string
  occurredAt: Date
}> {
  static readonly _NAME = 'document-production/document.manual-writing-started'

  constructor(payload: DocumentManualWritingStartedEvent['payload']) {
    super(DocumentManualWritingStartedEvent._NAME, payload)
  }
}
