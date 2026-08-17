import { Event } from '#shared/domain/events/event'

import type { IntakeStatus } from '../structures'

export class IntakeCreatedEvent extends Event<{
  intakeId: string
  clientId: string
  responsibleId: string
  legalAreaId: string
  legalTopicId: string
  demandNotes?: string
  status: IntakeStatus
  occurredAt: Date
}> {
  static readonly _NAME = 'intake/intake.created'

  constructor(payload: IntakeCreatedEvent['payload']) {
    super(IntakeCreatedEvent._NAME, payload)
  }
}
