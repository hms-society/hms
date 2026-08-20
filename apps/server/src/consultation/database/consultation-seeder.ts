import { Inject, Injectable } from '@nestjs/common'
import type { Consultation } from '@hms/core/consultation/domain/entities'
import { ConsultationFaker } from '@hms/core/consultation/domain/entities/fakers'
import type { DynamicForm } from '@hms/core/shared/domain'
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
  readonly dynamicForm?: DynamicForm
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
      status: ConsultationStatus.Pending,
      primaryLegalQuestion:
        'Which powers are required to represent the client in the lease negotiation?',
      guidanceProvided:
        'Prepare a limited power of attorney for negotiation and document review.',
      notes:
        'The client wants representation restricted to the residential lease negotiation.',
      dynamicFormId: references.dynamicForm?.id,
      dynamicFormSnapshot: references.dynamicForm
        ? {
            dynamicFormId: references.dynamicForm.id,
            name: references.dynamicForm.name,
            description: references.dynamicForm.description,
            fields: references.dynamicForm.fields,
          }
        : undefined,
    })
    const [createdConsultation] = await this.seed([consultation])

    return { consultation: createdConsultation }
  }
}
