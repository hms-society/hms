import { Event } from '#shared/domain/events/event'

import type { ClosureReason } from '../structures'

export class IntakeClosedEvent extends Event<{
  intakeId: string
  personId: string
  reason: ClosureReason
  justification: string
  closedByUserId: string
  occurredAt: Date
}> {
  static readonly _NAME = 'engagement/intake.closed'

  constructor(payload: IntakeClosedEvent['payload']) {
    super(IntakeClosedEvent._NAME, payload)
  }
}
