import { Event } from '#shared/domain/events/event'

export class ClientSuggestionGeneratedEvent extends Event<{
  clientSuggestionId: string
  documentBatchId: string
  clientId: string
  score: number
  occurredAt: Date
}> {
  static readonly _NAME = 'document-engine/client-suggestion.generated'

  constructor(payload: ClientSuggestionGeneratedEvent['payload']) {
    super(ClientSuggestionGeneratedEvent._NAME, payload)
  }
}
