import { Event } from '#shared/domain/events/event'

export class BlockedPeriodRemovedEvent extends Event<{
  scheduleId: string
  blockedPeriodId: string
  removedAt: Date
}> {
  static readonly _NAME = 'scheduling/blocked-period.removed'

  constructor(payload: BlockedPeriodRemovedEvent['payload']) {
    super(BlockedPeriodRemovedEvent._NAME, payload)
  }
}
