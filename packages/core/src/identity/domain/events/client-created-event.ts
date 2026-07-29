import { Event } from '#shared/domain/events/event'

export class ClientCreatedEvent extends Event<{
  clientId: string
  phone?: string
  email?: string
  createdAt: Date
}> {
  static readonly _NAME = 'identity/client.created'

  constructor(payload: ClientCreatedEvent['payload']) {
    super(ClientCreatedEvent._NAME, payload)
  }
}
