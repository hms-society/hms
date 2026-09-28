import { Event } from '#shared/domain/events/event'

export class AppointmentRescheduledEvent extends Event<{
  changeId: string
  appointmentId: string
  previousScheduleId: string
  newScheduleId: string
  clientId: string
  actorId: string
  previousStartsAt: Date
  previousEndsAt: Date
  newStartsAt: Date
  newEndsAt: Date
  rescheduledAt: Date
}> {
  static readonly _NAME = 'scheduling/appointment.rescheduled'

  constructor(payload: AppointmentRescheduledEvent['payload']) {
    super(AppointmentRescheduledEvent._NAME, payload)
  }
}
