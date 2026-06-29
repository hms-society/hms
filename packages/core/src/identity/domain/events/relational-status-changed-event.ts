import { Event } from '#shared/domain/events/event'
import type { RelationalStatus } from '../structures/relational-status'

export class RelationalStatusChangedEvent extends Event<{
  personId: string
  previousStatus: RelationalStatus
  newStatus: RelationalStatus
  reason: string
  changedAt: Date
}> {
  static readonly _NAME = 'identity/person.relational-status-changed'
  constructor(payload: RelationalStatusChangedEvent['payload']) {
    super(RelationalStatusChangedEvent._NAME, payload)
  }
}
