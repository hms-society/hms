import { Event } from '#shared/domain/events/event'

export class AttendanceClosedEvent extends Event<{
  attendanceId: string
  collaboratorId: string
  closedAt: Date
}> {
  static readonly _NAME = 'communication/attendance.closed'

  constructor(payload: AttendanceClosedEvent['payload']) {
    super(AttendanceClosedEvent._NAME, payload)
  }
}
