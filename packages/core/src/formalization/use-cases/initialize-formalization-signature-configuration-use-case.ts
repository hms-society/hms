import type { Broker, DatetimeProvider } from '../../shared/interfaces'
import type {
  FormalizationActor,
  FormalizationSignatureConfiguration,
} from '../domain/structures'
import {
  FormalizationNotFoundError,
  FormalizationStateConflictError,
} from '../domain/errors'
import type {
  FormalizationDocumentConfirmationTransaction,
  FormalizationsRepository,
  FormalizationSignatureConfigurationRepository,
} from '../interfaces'
import { FormalizationSignatureConfigurationUseCase } from './formalization-signature-configuration-use-case'

type Request = FormalizationActor & {
  readonly formalizationId: string
  readonly expectedVersion: number
}

export class InitializeFormalizationSignatureConfigurationUseCase extends FormalizationSignatureConfigurationUseCase<
  Request,
  FormalizationSignatureConfiguration
> {
  constructor(
    private readonly formalizationsRepository: FormalizationsRepository,
    private readonly confirmationTransaction: FormalizationDocumentConfirmationTransaction,
    private readonly configurationRepository: FormalizationSignatureConfigurationRepository,
    private readonly broker: Broker,
    private readonly datetimeProvider: DatetimeProvider,
  ) {
    super()
  }

  async execute(request: Request): Promise<FormalizationSignatureConfiguration> {
    const formalization = await this.formalizationsRepository.findById(
      request.formalizationId,
    )

    if (!formalization) throw new FormalizationNotFoundError()
    this.assertAccess(formalization.assignedLawyerId, request)
    if (!formalization.documentsConfirmedAt) {
      throw new FormalizationStateConflictError(
        'Confirme o pacote de documentos antes de inicializar a configuração.',
      )
    }
    const existingConfiguration =
      await this.configurationRepository.findByFormalizationId(formalization.id)
    if (existingConfiguration?.documents.length) return existingConfiguration

    const now = this.datetimeProvider.now()
    const result = await this.confirmationTransaction.initializeConfirmed({
      formalizationId: formalization.id,
      expectedVersion: request.expectedVersion,
      actorId: request.actorId,
      occurredAt: now,
    })

    await this.publishPendingPreviewBatch(
      formalization.id,
      result.pendingPreviewIds,
      now,
      this.configurationRepository,
      this.broker,
    )
    const configuration = await this.configurationRepository.findByFormalizationId(
      formalization.id,
    )
    if (!configuration) {
      throw new FormalizationStateConflictError(
        'A configuração de assinatura não foi criada.',
      )
    }
    return configuration
  }
}
