import { Event } from '#shared/domain/events/event'

import type { ConsultationChannel, ConsultationModality } from '../structures'

export class ConsultationScheduledEvent extends Event<{
  intakeId: string
  consultationId: string
  personId: string
  scheduledFor: Date
  modality: ConsultationModality
  channel: ConsultationChannel
  assignedLawyerId: string
  schedulingAppointmentId?: string
  scheduledByUserId: string
  occurredAt: Date
}> {
  static readonly _NAME = 'engagement/consultation.scheduled'

  constructor(payload: ConsultationScheduledEvent['payload']) {
    super(ConsultationScheduledEvent._NAME, payload)
  }
}
