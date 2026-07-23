import { Event } from '#shared/domain/events/event'

export class ClientUpdatedEvent extends Event<{
  clientId: string
  phone: string
  email?: string
  fieldsChanged: string[]
  updatedAt: Date
}> {
  static readonly _NAME = 'identity/client.updated'

  constructor(payload: ClientUpdatedEvent['payload']) {
    super(ClientUpdatedEvent._NAME, payload)
  }
}
