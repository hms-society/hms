import { Event } from '#shared/domain/events/event'

export class ConsultationCompletedEvent extends Event<{
  consultationId: string
  intakeId: string
  completedBy: string
  occurredAt: Date
}> {
  static readonly _NAME = 'consultation/consultation.completed'

  constructor(payload: ConsultationCompletedEvent['payload']) {
    super(ConsultationCompletedEvent._NAME, payload)
  }
}
