import type { DatetimeProvider } from '../../shared/interfaces'
import type { Formalization } from '../domain/entities'
import { FormalizationNotFoundError } from '../domain/errors'
import type { FormalizationActor } from '../domain/structures'
import type { FormalizationsRepository } from '../interfaces'
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

    const now = this.datetimeProvider.now()
    return this.confirmationTransaction.reopen({
      formalizationId: formalization.id,
      expectedVersion: request.expectedVersion,
      occurredAt: now,
    })
  }
}
