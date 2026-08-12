import { Event } from '#shared/domain/events/event'

export class IntakeConsultationSchedulingFailedEvent extends Event<{
  intakeId: string
  requestedBy: string
  failedAt: Date
}> {
  static readonly _NAME = 'intake/consultation.scheduling-failed'

  constructor(payload: IntakeConsultationSchedulingFailedEvent['payload']) {
    super(IntakeConsultationSchedulingFailedEvent._NAME, payload)
  }
}
