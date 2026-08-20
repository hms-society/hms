import type {
  ConsultationChannel,
  ConsultationModality,
} from '#consultation/domain/structures'
import { Event } from '#shared/domain/events/event'

export class IntakeConsultationSchedulingRequestedEvent extends Event<{
  intakeId: string
  clientId: string
  assignedLawyerId: string
  legalAreaId?: string
  legalTopicId?: string
  demandNotes?: string
  startsAt: Date
  modality: ConsultationModality
  channel?: ConsultationChannel
  requestedBy: string
  occurredAt: Date
}> {
  static readonly _NAME = 'intake/consultation.scheduling-requested'

  constructor(payload: IntakeConsultationSchedulingRequestedEvent['payload']) {
    super(IntakeConsultationSchedulingRequestedEvent._NAME, payload)
  }
}
