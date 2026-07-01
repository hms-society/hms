import { Event } from '#shared/domain/events/event'

import type { FeasibilityResult } from '../structures'

export class FeasibilityEvaluatedEvent extends Event<{
  intakeId: string
  feasibilityAssessmentId: string
  personId: string
  result: FeasibilityResult
  infeasibilityReason?: string
  assessedByUserId: string
  occurredAt: Date
}> {
  static readonly _NAME = 'engagement/feasibility.evaluated'

  constructor(payload: FeasibilityEvaluatedEvent['payload']) {
    super(FeasibilityEvaluatedEvent._NAME, payload)
  }
}
