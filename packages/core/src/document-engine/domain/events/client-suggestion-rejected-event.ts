import { Event } from '#shared/domain/events/event'

export class ClientSuggestionRejectedEvent extends Event<{
  clientSuggestionId: string
  documentBatchId: string
  reviewedByCollaboratorId: string
  occurredAt: Date
}> {
  static readonly _NAME = 'document-engine/client-suggestion.rejected'

  constructor(payload: ClientSuggestionRejectedEvent['payload']) {
    super(ClientSuggestionRejectedEvent._NAME, payload)
  }
}
