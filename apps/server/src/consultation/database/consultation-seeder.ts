import { Inject, Injectable } from '@nestjs/common'
import type { Consultation } from '@hms/core/consultation/domain/entities'
import { ConsultationFaker } from '@hms/core/consultation/domain/entities/fakers'
import {
  ConsultationChannel,
  ConsultationModality,
  ConsultationStatus,
} from '@hms/core/consultation/domain/structures'
import type { ConsultationsRepository } from '@hms/core/consultation/interfaces'

import { CONSULTATION_REPOSITORIES } from '@/consultation/constants/consultation-repositories'

const DOCUMENT_PRODUCTION_CONSULTATION_ID = '00000000-0000-4000-8000-000000000101'

export type ConsultationSeedReferences = {
  readonly intakeId: string
  readonly appointmentId: string
  readonly clientId: string
  readonly assignedLawyerId: string
  readonly legalAreaId: string
  readonly legalTopicId: string
}

@Injectable()
export class ConsultationSeeder {
  constructor(
    @Inject(CONSULTATION_REPOSITORIES.consultations)
    private readonly consultationsRepository: ConsultationsRepository,
  ) {}

  seed(consultations: readonly Consultation[]) {
    return this.consultationsRepository.addMany(consultations)
  }

  clear() {
    return this.consultationsRepository.removeAll()
  }

  async run(references: ConsultationSeedReferences) {
    const startedAt = new Date('2030-01-14T13:00:00.000Z')
    const consultation = ConsultationFaker.fake({
      id: DOCUMENT_PRODUCTION_CONSULTATION_ID,
      intakeId: references.intakeId,
      appointmentId: references.appointmentId,
      clientId: references.clientId,
      assignedLawyerId: references.assignedLawyerId,
      legalAreaId: references.legalAreaId,
      legalTopicId: references.legalTopicId,
      modality: ConsultationModality.Virtual,
      channel: ConsultationChannel.GoogleMeet,
      status: ConsultationStatus.Completed,
      primaryLegalQuestion:
        'Which powers are required to represent the client in the lease negotiation?',
      guidanceProvided:
        'Prepare a limited power of attorney for negotiation and document review.',
      notes:
        'The client wants representation restricted to the residential lease negotiation.',
      startedAt,
      completedAt: new Date('2030-01-14T13:45:00.000Z'),
    })
    const [createdConsultation] = await this.seed([consultation])

    return { consultation: createdConsultation }
  }
}
