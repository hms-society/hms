import { Event } from '#shared/domain/events/event'
import type { UserStatus } from '../structures'

export class UserCreatedEvent extends Event<{
  userId: string
  email: string
  status: UserStatus
  createdAt: Date
}> {
  static readonly _NAME = 'identity/user.created'
  constructor(payload: UserCreatedEvent['payload']) {
    super(UserCreatedEvent._NAME, payload)
  }
}
