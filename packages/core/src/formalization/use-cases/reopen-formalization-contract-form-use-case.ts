import type { Formalization } from '../domain/entities'
import {
  FormalizationNotFoundError,
  FormalizationStateConflictError,
  FormalizationVersionConflictError,
} from '../domain/errors'
import { FormalizationContractFormState, FormalizationStatus } from '../domain/structures'
import type { FormalizationActor } from '../domain/structures'
import type { FormalizationsRepository } from '../interfaces'
import type { UseCase } from '../../shared/interfaces'
import { FormalizationActorAuthorization } from './formalization-actor-authorization'

type Request = FormalizationActor & {
  readonly formalizationId: string
  readonly expectedVersion: number
}

export class ReopenFormalizationContractFormUseCase
  implements UseCase<Request, Formalization>
{
  constructor(private readonly formalizationsRepository: FormalizationsRepository) {}

  async execute(request: Request): Promise<Formalization> {
    const formalization = await this.formalizationsRepository.findById(
      request.formalizationId,
    )
    if (!formalization) throw new FormalizationNotFoundError()
    FormalizationActorAuthorization.assertAccess(formalization.assignedLawyerId, request)
    if (formalization.status !== FormalizationStatus.InProgress) {
      throw new FormalizationStateConflictError()
    }
    if (formalization.contractFormState === FormalizationContractFormState.Open) {
      return formalization
    }
    const reopened = await this.formalizationsRepository.replace({
      formalizationId: formalization.id,
      expectedVersion: request.expectedVersion,
      changes: { contractFormState: FormalizationContractFormState.Open },
    })
    if (!reopened) throw new FormalizationVersionConflictError()
    return reopened
  }
}
