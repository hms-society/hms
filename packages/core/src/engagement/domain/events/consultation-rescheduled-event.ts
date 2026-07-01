import { Event } from '#shared/domain/events/event'

export class ConsultationRescheduledEvent extends Event<{
  intakeId: string
  consultationId: string
  personId: string
  previousScheduledFor: Date
  newScheduledFor: Date
  reason?: string
  rescheduledByUserId: string
  occurredAt: Date
}> {
  static readonly _NAME = 'engagement/consultation.rescheduled'

  constructor(payload: ConsultationRescheduledEvent['payload']) {
    super(ConsultationRescheduledEvent._NAME, payload)
  }
}
