import { Event } from '#shared/domain/events/event'

import type { ContactChannel, IntakeOrigin } from '../structures'

export class IntakeOpenedEvent extends Event<{
  intakeId: string
  personId: string
  demandTypeId: string
  origin: IntakeOrigin
  contactChannel: ContactChannel
  thirdPartyId?: string
  assignedLawyerId?: string
  createdByUserId: string
  occurredAt: Date
}> {
  static readonly _NAME = 'engagement/intake.opened'

  constructor(payload: IntakeOpenedEvent['payload']) {
    super(IntakeOpenedEvent._NAME, payload)
  }
}
