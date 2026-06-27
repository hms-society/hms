import { Event } from '#shared/domain/events/event'
import type { Profile } from '../structures/profile'

export class UserCreatedEvent extends Event<{
  userId: string
  personId: string
  profile: Profile
  createdAt: Date
}> {
  static readonly _NAME = 'identity/user.created'
  constructor(payload: UserCreatedEvent['payload']) {
    super(UserCreatedEvent._NAME, payload)
  }
}
