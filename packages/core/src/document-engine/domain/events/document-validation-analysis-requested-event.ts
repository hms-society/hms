import { Event } from '#shared/domain/events/event'

export class DocumentValidationAnalysisRequestedEvent extends Event<{
  documentFileId: string
  requestedBy: string
  occurredAt: Date
}> {
  static readonly _NAME = 'document-engine/document-validation.analysis-requested'

  constructor(payload: DocumentValidationAnalysisRequestedEvent['payload']) {
    super(DocumentValidationAnalysisRequestedEvent._NAME, payload)
  }
}
