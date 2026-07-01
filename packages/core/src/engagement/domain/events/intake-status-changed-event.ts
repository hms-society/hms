import { Event } from '#shared/domain/events/event'

import type { IntakeStatus } from '../structures'

export class IntakeStatusChangedEvent extends Event<{
  intakeId: string
  fromStatus: IntakeStatus
  toStatus: IntakeStatus
  reason?: string
  changedByUserId: string
  occurredAt: Date
}> {
  static readonly _NAME = 'engagement/intake.status-changed'

  constructor(payload: IntakeStatusChangedEvent['payload']) {
    super(IntakeStatusChangedEvent._NAME, payload)
  }
}
