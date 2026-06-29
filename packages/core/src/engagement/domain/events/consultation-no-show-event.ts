import { Event } from '#shared/domain/events/event'

export class ConsultationNoShowEvent extends Event<{
  intakeId: string
  consultationId: string
  personId: string
  scheduledFor: Date
  registeredByUserId: string
  occurredAt: Date
}> {
  static readonly _NAME = 'engagement/consultation.no-show'

  constructor(payload: ConsultationNoShowEvent['payload']) {
    super(ConsultationNoShowEvent._NAME, payload)
  }
}
