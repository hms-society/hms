import { Event } from '#shared/domain/events/event'
import type {
  ConsultationChannel,
  ConsultationModality,
} from '#consultation/domain/structures'

export class AppointmentReservedEvent extends Event<{
  appointmentId: string
  intakeId: string
  scheduleId: string
  clientId: string
  assignedLawyerId: string
  legalAreaId?: string
  legalTopicId?: string
  demandNotes?: string
  modality: ConsultationModality
  channel?: ConsultationChannel
  requestedBy: string
  startsAt: Date
  endsAt: Date
  reservedAt: Date
}> {
  static readonly _NAME = 'scheduling/appointment.reserved'

  constructor(payload: AppointmentReservedEvent['payload']) {
    super(AppointmentReservedEvent._NAME, payload)
  }
}
