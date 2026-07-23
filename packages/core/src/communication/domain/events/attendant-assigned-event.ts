import { Event } from '#shared/domain/events/event'

export class AttendantAssignedEvent extends Event<{
  attendantAssignmentId: string
  attendanceId: string
  collaboratorId: string
  assignedAt: Date
}> {
  static readonly _NAME = 'communication/attendant.assigned'

  constructor(payload: AttendantAssignedEvent['payload']) {
    super(AttendantAssignedEvent._NAME, payload)
  }
}
