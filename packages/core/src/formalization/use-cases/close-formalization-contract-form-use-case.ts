import type { DatetimeProvider, UseCase } from '../../shared/interfaces'
import { ValidateDynamicFormAnswersUseCase } from '../../shared/use-cases'
import type { DynamicFormAnswer } from '../../shared/domain/structures'
import type { Formalization } from '../domain/entities'
import {
  FormalizationContractFormValidationError,
  FormalizationNotFoundError,
  FormalizationStateConflictError,
  FormalizationVersionConflictError,
} from '../domain/errors'
import { FormalizationContractFormState, FormalizationStatus } from '../domain/structures'
import type { FormalizationActor } from '../domain/structures'
import type { FormalizationsRepository } from '../interfaces'
import { FormalizationActorAuthorization } from './formalization-actor-authorization'

type Request = FormalizationActor & {
  readonly formalizationId: string
  readonly expectedVersion: number
  readonly answers: readonly DynamicFormAnswer[]
}

export class CloseFormalizationContractFormUseCase
  implements UseCase<Request, Formalization>
{
  private readonly validateAnswersUseCase = new ValidateDynamicFormAnswersUseCase()

  constructor(
    private readonly formalizationsRepository: FormalizationsRepository,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<Formalization> {
    const formalization = await this.formalizationsRepository.findById(request.formalizationId)
    if (!formalization) throw new FormalizationNotFoundError()
    FormalizationActorAuthorization.assertAccess(formalization.assignedLawyerId, request)
    if (formalization.status !== FormalizationStatus.InProgress) {
      throw new FormalizationStateConflictError()
    }
    if (formalization.contractFormState !== FormalizationContractFormState.Open) {
      throw new FormalizationStateConflictError('Reabra o formulário antes de fechá-lo novamente.')
    }

    const validation = await this.validateAnswersUseCase.execute({
      snapshot: formalization.contractFormSnapshot,
      answers: request.answers,
      mode: 'complete',
    })
    if (validation.issues.length > 0) {
      throw new FormalizationContractFormValidationError(validation.issues)
    }

    const hasChanged = JSON.stringify(formalization.contractFormAnswers) !== JSON.stringify(validation.answers)
    const contractFormRevision = formalization.contractFormRevision === 0
      ? 1
      : hasChanged
        ? formalization.contractFormRevision + 1
        : formalization.contractFormRevision
    const now = this.datetimeProvider.now()
    const updated = await this.formalizationsRepository.replace({
      formalizationId: formalization.id,
      expectedVersion: request.expectedVersion,
      changes: {
        contractFormAnswers: [...validation.answers],
        contractFormState: FormalizationContractFormState.Closed,
        contractFormRevision,
        contractFormClosedAt: now,
        contractFormClosedByCollaboratorId: request.actorId,
        ...(hasChanged
          ? {
              documentsConfirmedAt: undefined,
              documentsConfirmedByCollaboratorId: undefined,
              documentsConfirmedRevision: undefined,
            }
          : {}),
      },
    })
    if (!updated) throw new FormalizationVersionConflictError()
    return updated
  }
}
