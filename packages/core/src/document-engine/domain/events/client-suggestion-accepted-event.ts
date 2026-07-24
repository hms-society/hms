import { Event } from '#shared/domain/events/event'

export class ClientSuggestionAcceptedEvent extends Event<{
  clientSuggestionId: string
  documentBatchId: string
  clientId: string
  reviewedByCollaboratorId: string
  occurredAt: Date
}> {
  static readonly _NAME = 'document-engine/client-suggestion.accepted'

  constructor(payload: ClientSuggestionAcceptedEvent['payload']) {
    super(ClientSuggestionAcceptedEvent._NAME, payload)
  }
}
