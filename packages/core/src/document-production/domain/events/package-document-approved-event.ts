import { Event } from '#shared/domain/events/event'

export class PackageDocumentApprovedEvent extends Event<{
  packageDocumentId: string
  approvedByCollaboratorId: string
  occurredAt: Date
}> {
  static readonly _NAME = 'document-production/package-document.approved'

  constructor(payload: PackageDocumentApprovedEvent['payload']) {
    super(PackageDocumentApprovedEvent._NAME, payload)
  }
}
