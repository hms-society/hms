import { Event } from '#shared/domain/events/event'

export class AppointmentRescheduledEvent extends Event<{
  appointmentId: string
  previousStartsAt: Date
  newStartsAt: Date
  rescheduledAt: Date
}> {
  static readonly _NAME = 'scheduling/appointment.rescheduled'

  constructor(payload: AppointmentRescheduledEvent['payload']) {
    super(AppointmentRescheduledEvent._NAME, payload)
  }
}
