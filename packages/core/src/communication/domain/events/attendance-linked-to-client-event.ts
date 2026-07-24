import { Event } from '#shared/domain/events/event'

export class AttendanceLinkedToClientEvent extends Event<{
  attendanceId: string
  clientId: string
  linkedAt: Date
}> {
  static readonly _NAME = 'communication/attendance.linked-to-client'

  constructor(payload: AttendanceLinkedToClientEvent['payload']) {
    super(AttendanceLinkedToClientEvent._NAME, payload)
  }
}
