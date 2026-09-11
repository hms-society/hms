import type { Formalization } from '../domain/entities'
import {
  FormalizationNotFoundError,
  FormalizationStateConflictError,
  FormalizationVersionConflictError,
} from '../domain/errors'
import { FormalizationContractFormState, FormalizationStatus } from '../domain/structures'
import type { FormalizationActor } from '../domain/structures'
import { FormalizationSignatureRequestStatus } from '../domain/structures'
import type {
  FormalizationSignatureRequestsRepository,
  FormalizationsRepository,
} from '../interfaces'
import { FormalizationUseCase } from './formalization-use-case'

type Request = FormalizationActor & {
  readonly formalizationId: string
  readonly expectedVersion: number
}

export class ReopenFormalizationContractFormUseCase extends FormalizationUseCase<
  Request,
  Formalization
> {
  constructor(
    private readonly formalizationsRepository: FormalizationsRepository,
    private readonly requestsRepository: FormalizationSignatureRequestsRepository,
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
    if (formalization.contractFormState === FormalizationContractFormState.Open) {
      return formalization
    }

    const signatureRequest = await this.requestsRepository.findLatestByFormalizationId(
      formalization.id,
    )
    if (
      signatureRequest &&
      signatureRequest.status !== FormalizationSignatureRequestStatus.cancelled
    ) {
      throw new FormalizationStateConflictError(
        'Cancele o envio de assinaturas antes de reabrir o formulário.',
      )
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
