import { Inject, Injectable } from '@nestjs/common'
import type {
  Formalization,
  FormalizationContext,
  FormalizationStartSource,
} from '@hms/core/formalization'
import type {
  ClientsRepository,
  CollaboratorsRepository,
} from '@hms/core/identity/interfaces'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import type { ConsultationsRepository } from '@hms/core/consultation/interfaces'
import type { DynamicFormsRepository } from '@hms/core/shared/interfaces'
import { ConsultationStatus } from '@hms/core/consultation/domain/structures'
import { IntakeStatus } from '@hms/core/intake/domain/structures'

import { CONSULTATION_REPOSITORIES } from '@/consultation/constants/consultation-repositories'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { DYNAMIC_FORMS_REPOSITORIES } from '@/shared/constants/dynamic-forms-repositories'

@Injectable()
export class ServerFormalizationSourceReader {
  constructor(
    @Inject(INTAKE_REPOSITORIES.intakes)
    private readonly intakesRepository: IntakesRepository,
    @Inject(CONSULTATION_REPOSITORIES.consultations)
    private readonly consultationsRepository: ConsultationsRepository,
    @Inject(IDENTITY_REPOSITORIES.clients)
    private readonly clientsRepository: ClientsRepository,
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    private readonly collaboratorsRepository: CollaboratorsRepository,
    @Inject(DYNAMIC_FORMS_REPOSITORIES.dynamicForms)
    private readonly dynamicFormsRepository: DynamicFormsRepository,
  ) {}

  async findStartSource(intakeId: string): Promise<FormalizationStartSource | undefined> {
    const intake = await this.intakesRepository.findById(intakeId)
    if (!intake) return undefined
    if (
      intake.status !== IntakeStatus.ViabilityRegistered &&
      intake.status !== IntakeStatus.InFormalization
    ) {
      return undefined
    }

    const consultation = await this.consultationsRepository.findByIntakeId(intakeId)
    if (!consultation || consultation.status !== ConsultationStatus.Completed) {
      return undefined
    }

    const [client, assignedLawyer, dynamicForms] = await Promise.all([
      this.clientsRepository.findById(intake.clientId),
      this.collaboratorsRepository.findById(consultation.assignedLawyerId),
      this.dynamicFormsRepository.list(),
    ])
    const contractForm = dynamicForms.find((form) =>
      form.contexts.some((context) => {
        if (context.type !== 'formalization') return false
        const legalAreaId = context.data.legalAreaId
        const legalTopicIds = context.data.legalTopicIds
        return (
          legalAreaId === intake.legalAreaId &&
          Array.isArray(legalTopicIds) &&
          legalTopicIds.includes(intake.legalTopicId)
        )
      }),
    )

    if (!client || !assignedLawyer || !contractForm) return undefined

    return { intake, consultation, client, assignedLawyer, contractForm }
  }

  async findContractForm(formalization: Formalization, dynamicFormId: string) {
    const intake = await this.intakesRepository.findById(formalization.intakeId)
    if (!intake) return undefined

    const forms = await this.dynamicFormsRepository.list()
    const legalAreaId = formalization.legalAreaId ?? intake.legalAreaId
    const legalTopicId = formalization.legalTopicId ?? intake.legalTopicId
    return forms.find(
      (form) =>
        form.id === dynamicFormId &&
        form.status === 'available' &&
        form.contexts.some((context) => {
          if (context.type !== 'formalization') return false
          const legalTopicIds = context.data.legalTopicIds
          return (
            context.data.legalAreaId === legalAreaId &&
            Array.isArray(legalTopicIds) &&
            legalTopicId !== undefined &&
            legalTopicIds.includes(legalTopicId)
          )
        }),
    )
  }

  async findContext(
    formalization: Formalization,
  ): Promise<FormalizationContext | undefined> {
    const [intake, consultation, client, assignedLawyer] = await Promise.all([
      this.intakesRepository.findById(formalization.intakeId),
      this.consultationsRepository.findById(formalization.consultationId),
      this.clientsRepository.findById(formalization.clientId),
      this.collaboratorsRepository.findById(formalization.assignedLawyerId),
    ])

    if (!intake || !consultation || !client || !assignedLawyer) return undefined

    return { intake, consultation, client, assignedLawyer }
  }
}
