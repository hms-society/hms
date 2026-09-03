import type { DatetimeProvider } from '../../shared/interfaces'
import { ValidateDynamicFormAnswersUseCase } from '../../shared/use-cases'
import type {
  DynamicFormAnswer,
  DynamicFormAnswerValue,
} from '../../shared/domain/structures'
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
import { FormalizationUseCase } from './formalization-use-case'

type Request = FormalizationActor & {
  readonly formalizationId: string
  readonly expectedVersion: number
  readonly answers: readonly DynamicFormAnswer[]
}
export class CloseFormalizationContractFormUseCase extends FormalizationUseCase<
  Request,
  Formalization
> {
  private readonly validateAnswersUseCase = new ValidateDynamicFormAnswersUseCase()

  constructor(
    private readonly formalizationsRepository: FormalizationsRepository,
    private readonly datetimeProvider: DatetimeProvider,
  ) {
    super()
  }

  async execute(request: Request): Promise<Formalization> {
    const formalization = await this.formalizationsRepository.findById(
      request.formalizationId,
    )

    if (!formalization) throw new FormalizationNotFoundError()
    this.assertAccess(formalization.assignedLawyerId, request)
    if (formalization.status !== FormalizationStatus.InProgress) {
      throw new FormalizationStateConflictError()
    }
    if (formalization.contractFormState !== FormalizationContractFormState.Open) {
      throw new FormalizationStateConflictError(
        'Reabra o formulário antes de fechá-lo novamente.',
      )
    }

    const validation = await this.validateAnswersUseCase.execute({
      snapshot: formalization.contractFormSnapshot,
      answers: request.answers,
      mode: 'complete',
    })
    if (validation.issues.length > 0) {
      throw new FormalizationContractFormValidationError(validation.issues)
    }

    const hasChanged = !this.answersEqual(
      formalization.contractFormAnswers,
      validation.answers,
    )
    const contractFormRevision =
      formalization.contractFormRevision === 0
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

  private answersEqual(
    first: readonly DynamicFormAnswer[],
    second: readonly DynamicFormAnswer[],
  ): boolean {
    if (first.length !== second.length) return false

    const firstByFieldId = new Map(first.map((answer) => [answer.fieldId, answer.value]))
    const secondByFieldId = new Map(
      second.map((answer) => [answer.fieldId, answer.value]),
    )
    if (firstByFieldId.size !== first.length || secondByFieldId.size !== second.length) {
      return false
    }

    return [...firstByFieldId.keys()].sort().every((fieldId) => {
      const firstValue = firstByFieldId.get(fieldId)
      const secondValue = secondByFieldId.get(fieldId)
      return secondByFieldId.has(fieldId) && this.valuesEqual(firstValue, secondValue)
    })
  }

  private valuesEqual(
    first: DynamicFormAnswerValue | undefined,
    second: DynamicFormAnswerValue | undefined,
  ): boolean {
    if (Array.isArray(first) || Array.isArray(second)) {
      if (
        !Array.isArray(first) ||
        !Array.isArray(second) ||
        first.length !== second.length
      ) {
        return false
      }
      const firstValues = [...first].sort()
      const secondValues = [...second].sort()
      return firstValues.every((value, index) => value === secondValues[index])
    }
    return first === second
  }
}
