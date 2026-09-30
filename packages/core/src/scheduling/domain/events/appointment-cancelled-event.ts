import { Event } from '#shared/domain/events/event'

export class AppointmentCancelledEvent extends Event<{
  changeId: string
  appointmentId: string
  scheduleId: string
  clientId: string
  actorId: string
  startsAt: Date
  endsAt: Date
  cancelledAt: Date
}> {
  static readonly _NAME = 'scheduling/appointment.cancelled'

  constructor(payload: AppointmentCancelledEvent['payload']) {
    super(AppointmentCancelledEvent._NAME, payload)
  }
}
