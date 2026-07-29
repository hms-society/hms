import { Event } from '#shared/domain/events/event'

export class AttendanceStartedEvent extends Event<{
  attendanceId: string
  clientId?: string
  startedAt: Date
}> {
  static readonly _NAME = 'communication/attendance.started'

  constructor(payload: AttendanceStartedEvent['payload']) {
    super(AttendanceStartedEvent._NAME, payload)
  }
}
