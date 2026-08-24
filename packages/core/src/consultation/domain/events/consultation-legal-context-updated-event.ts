import { Event } from '#shared/domain/events/event'

export class ConsultationLegalContextUpdatedEvent extends Event<{
  consultationId: string
  intakeId: string
  legalAreaId: string
  legalTopicId: string
  updatedBy: string
  occurredAt: Date
}> {
  static readonly _NAME = 'consultation/consultation.legal-context-updated'

  constructor(payload: ConsultationLegalContextUpdatedEvent['payload']) {
    super(ConsultationLegalContextUpdatedEvent._NAME, payload)
  }
}
