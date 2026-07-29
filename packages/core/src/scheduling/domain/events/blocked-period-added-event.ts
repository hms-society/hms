import { Event } from '#shared/domain/events/event'
import type { CalendarDate } from '../structures'

export class BlockedPeriodAddedEvent extends Event<{
  scheduleId: string
  blockedPeriodId: string
  startsOn: CalendarDate
  endsOn: CalendarDate
  addedAt: Date
}> {
  static readonly _NAME = 'scheduling/blocked-period.added'

  constructor(payload: BlockedPeriodAddedEvent['payload']) {
    super(BlockedPeriodAddedEvent._NAME, payload)
  }
}
