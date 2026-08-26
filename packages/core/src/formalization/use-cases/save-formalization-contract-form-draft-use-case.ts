import type { UseCase } from '../../shared/interfaces'
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

export class SaveFormalizationContractFormDraftUseCase
  implements UseCase<Request, Formalization>
{
  private readonly validateAnswersUseCase = new ValidateDynamicFormAnswersUseCase()

  constructor(private readonly formalizationsRepository: FormalizationsRepository) {}

  async execute(request: Request): Promise<Formalization> {
    const formalization = await this.formalizationsRepository.findById(request.formalizationId)
    if (!formalization) throw new FormalizationNotFoundError()
    FormalizationActorAuthorization.assertAccess(formalization.assignedLawyerId, request)
    if (
      formalization.status !== FormalizationStatus.InProgress ||
      formalization.contractFormState !== FormalizationContractFormState.Open
    ) {
      throw new FormalizationStateConflictError('O formulário não está aberto para rascunho.')
    }

    const validation = await this.validateAnswersUseCase.execute({
      snapshot: formalization.contractFormSnapshot,
      answers: request.answers,
      mode: 'draft',
    })
    if (validation.issues.length > 0) {
      throw new FormalizationContractFormValidationError(validation.issues)
    }
    const updated = await this.formalizationsRepository.replace({
      formalizationId: formalization.id,
      expectedVersion: request.expectedVersion,
      changes: { contractFormAnswers: [...validation.answers] },
    })
    if (!updated) throw new FormalizationVersionConflictError()
    return updated
  }
}
