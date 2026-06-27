import { Event } from '#shared/domain/events/event'

export class UserDeactivatedEvent extends Event<{
  userId: string
}> {
  static readonly _NAME = 'identity/user.deactivated'
  constructor(payload: UserDeactivatedEvent['payload']) {
    super(UserDeactivatedEvent._NAME, payload)
  }
}
