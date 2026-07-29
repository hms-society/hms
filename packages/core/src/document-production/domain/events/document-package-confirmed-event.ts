import { Event } from '#shared/domain/events/event'

export class DocumentPackageConfirmedEvent extends Event<{
  documentPackageId: string
  confirmedByCollaboratorId: string
  occurredAt: Date
}> {
  static readonly _NAME = 'document-production/document-package.confirmed'

  constructor(payload: DocumentPackageConfirmedEvent['payload']) {
    super(DocumentPackageConfirmedEvent._NAME, payload)
  }
}
