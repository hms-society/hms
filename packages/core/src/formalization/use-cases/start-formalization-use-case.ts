import type { IdProvider, UseCase } from '../../shared/interfaces'
import { CollaboratorProfile } from '../../identity/domain/structures'
import { IntakeStatus } from '../../intake/domain/structures'
import type { Formalization, FormalizationCreation } from '../domain/entities'
import {
  FormalizationAccessDeniedError,
  FormalizationIneligibleError,
} from '../domain/errors'
import { FormalizationContractFormState, FormalizationStatus } from '../domain/structures'
import type { FormalizationActor } from '../domain/structures'
import type {
  FormalizationIntakeLifecycleService,
  FormalizationSourceReader,
  FormalizationsRepository,
} from '../interfaces'
import { FormalizationActorAuthorization } from './formalization-actor-authorization'

type Request = FormalizationActor & {
  readonly intakeId: string
}

export class StartFormalizationUseCase implements UseCase<Request, Formalization> {
  constructor(
    private readonly formalizationsRepository: FormalizationsRepository,
    private readonly sourceReader: FormalizationSourceReader,
    private readonly intakeLifecycleService: FormalizationIntakeLifecycleService,
    private readonly idProvider: IdProvider,
  ) {}

  async execute(request: Request): Promise<Formalization> {
    const source = await this.sourceReader.findStartSource(request.intakeId)
    if (!source) throw new FormalizationIneligibleError()
    if (
      source.assignedLawyer.profile !== CollaboratorProfile.Lawyer ||
      (!FormalizationActorAuthorization.isAdmin(request.actorProfile) &&
        source.assignedLawyer.id !== request.actorId)
    ) {
      throw new FormalizationAccessDeniedError()
    }

    if (
      source.intake.status !== IntakeStatus.ViabilityRegistered &&
      source.intake.status !== IntakeStatus.InFormalization
    ) {
      throw new FormalizationIneligibleError()
    }

    const existing = await this.formalizationsRepository.findByIntakeId(request.intakeId)
    if (existing) {
      FormalizationActorAuthorization.assertAccess(existing.assignedLawyerId, request)
      return existing
    }

    const creation: FormalizationCreation = {
      id: this.idProvider.generate(),
      intakeId: source.intake.id,
      clientId: source.client.id,
      consultationId: source.consultation.id,
      assignedLawyerId: source.assignedLawyer.id,
      legalAreaId: source.intake.legalAreaId,
      legalTopicId: source.intake.legalTopicId,
      status: FormalizationStatus.InProgress,
      contractFormId: source.contractForm.id,
      contractFormSnapshot: {
        dynamicFormId: source.contractForm.id,
        name: source.contractForm.name,
        description: source.contractForm.description,
        fields: source.contractForm.fields.map((field) => ({ ...field })),
      },
      contractFormAnswers: [],
      contractFormState: FormalizationContractFormState.Open,
      contractFormRevision: 0,
      version: 1,
    }
    const formalization = await this.intakeLifecycleService.startFormalization({
      formalization: creation,
      actorId: request.actorId,
      expectedIntakeVersion: source.intake.version,
    })
    FormalizationActorAuthorization.assertAccess(formalization.assignedLawyerId, request)
    return formalization
  }
}
