import { Event } from '#shared/domain/events/event'

export class ConsultationHeldEvent extends Event<{
  intakeId: string
  consultationId: string
  heldAt: Date
  heldByUserId: string
  occurredAt: Date
}> {
  static readonly _NAME = 'engagement/consultation.held'

  constructor(payload: ConsultationHeldEvent['payload']) {
    super(ConsultationHeldEvent._NAME, payload)
  }
}
