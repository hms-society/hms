import { Event } from '#shared/domain/events/event'

export class PersonUpdatedEvent extends Event<{
  personId: string
  fieldsChanged: string[]
  updatedAt: Date
}> {
  static readonly _NAME = 'identity/person.updated'
  constructor(payload: PersonUpdatedEvent['payload']) {
    super(PersonUpdatedEvent._NAME, payload)
  }
}
