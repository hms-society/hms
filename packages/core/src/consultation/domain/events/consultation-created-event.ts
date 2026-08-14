import { Event } from '#shared/domain/events/event'

export class ConsultationCreatedEvent extends Event<{
  consultationId: string
  intakeId: string
  requestedBy: string
  occurredAt: Date
}> {
  static readonly _NAME = 'consultation/consultation.created'

  constructor(payload: ConsultationCreatedEvent['payload']) {
    super(ConsultationCreatedEvent._NAME, payload)
  }
}
