import { Event } from '#shared/domain/events/event'

import type { SignatureType } from '../structures'

export class FormalizationCompletedEvent extends Event<{
  intakeId: string
  formalizationId: string
  personId: string
  demandTypeId: string
  signatureType: SignatureType
  formalizedAt: Date
  completedByUserId: string
  occurredAt: Date
}> {
  static readonly _NAME = 'engagement/formalization.completed'

  constructor(payload: FormalizationCompletedEvent['payload']) {
    super(FormalizationCompletedEvent._NAME, payload)
  }
}
