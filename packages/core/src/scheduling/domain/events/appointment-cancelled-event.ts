import { Event } from '#shared/domain/events/event'

export class AppointmentCancelledEvent extends Event<{
  appointmentId: string
  cancelledAt: Date
}> {
  static readonly _NAME = 'scheduling/appointment.cancelled'

  constructor(payload: AppointmentCancelledEvent['payload']) {
    super(AppointmentCancelledEvent._NAME, payload)
  }
}
