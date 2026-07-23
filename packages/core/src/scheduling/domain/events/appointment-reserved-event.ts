import { Event } from '#shared/domain/events/event'

export class AppointmentReservedEvent extends Event<{
  appointmentId: string
  scheduleId: string
  clientId: string
  startsAt: Date
  endsAt: Date
  reservedAt: Date
}> {
  static readonly _NAME = 'scheduling/appointment.reserved'

  constructor(payload: AppointmentReservedEvent['payload']) {
    super(AppointmentReservedEvent._NAME, payload)
  }
}
