import { Event } from '#shared/domain/events/event'

export class PersonCreatedEvent extends Event<{
  personId: string
  taxId: string
  createdAt: Date
}> {
  static readonly _NAME = 'identity/person.created'
  constructor(payload: PersonCreatedEvent['payload']) {
    super(PersonCreatedEvent._NAME, payload)
  }
}
