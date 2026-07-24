import { Event } from '#shared/domain/events/event'

export class ScheduleConfiguredEvent extends Event<{
  scheduleId: string
  collaboratorId: string
  timeZone: string
  configuredAt: Date
}> {
  static readonly _NAME = 'scheduling/schedule.configured'

  constructor(payload: ScheduleConfiguredEvent['payload']) {
    super(ScheduleConfiguredEvent._NAME, payload)
  }
}
