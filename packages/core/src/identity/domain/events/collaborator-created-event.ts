import { Event } from '#shared/domain/events/event'
import type { CollaboratorProfile } from '../structures'

export class CollaboratorCreatedEvent extends Event<{
  collaboratorId: string
  userId: string
  profile: CollaboratorProfile
  createdAt: Date
}> {
  static readonly _NAME = 'identity/collaborator.created'

  constructor(payload: CollaboratorCreatedEvent['payload']) {
    super(CollaboratorCreatedEvent._NAME, payload)
  }
}
