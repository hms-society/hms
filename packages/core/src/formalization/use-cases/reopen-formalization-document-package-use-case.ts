import type { DatetimeProvider } from '../../shared/interfaces'
import type { Formalization } from '../domain/entities'
import {
  FormalizationNotFoundError,
  FormalizationStateConflictError,
} from '../domain/errors'
import type { FormalizationActor } from '../domain/structures'
import { FormalizationSignatureRequestStatus } from '../domain/structures'
import type {
  FormalizationSignatureRequestsRepository,
  FormalizationsRepository,
} from '../interfaces'
import type { FormalizationDocumentConfirmationTransaction } from '../interfaces'
import { FormalizationUseCase } from './formalization-use-case'

type Request = FormalizationActor & {
  readonly formalizationId: string
  readonly expectedVersion: number
}

export class ReopenFormalizationDocumentPackageUseCase extends FormalizationUseCase<
  Request,
  Formalization
> {
  constructor(
    private readonly formalizationsRepository: FormalizationsRepository,
    private readonly requestsRepository: FormalizationSignatureRequestsRepository,
    private readonly confirmationTransaction: FormalizationDocumentConfirmationTransaction,
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
    if (!formalization.documentsConfirmedAt) return formalization

    const signatureRequest = await this.requestsRepository.findLatestByFormalizationId(
      formalization.id,
    )
    if (
      signatureRequest &&
      signatureRequest.status !== FormalizationSignatureRequestStatus.cancelled
    ) {
      throw new FormalizationStateConflictError(
        'Cancele o envio de assinaturas antes de editar o pacote.',
      )
    }

    const now = this.datetimeProvider.now()
    return this.confirmationTransaction.reopen({
      formalizationId: formalization.id,
      expectedVersion: request.expectedVersion,
      occurredAt: now,
    })
  }
}
