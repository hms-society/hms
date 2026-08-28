import type { Broker, DatetimeProvider } from '../../shared/interfaces'
import type {
  FormalizationActor,
  FormalizationSignatureConfiguration,
} from '../domain/structures'
import { FormalizationSignaturePreviewGenerationRequestedEvent } from '../domain/events'
import {
  FormalizationNotFoundError,
  FormalizationSignatureNotInitializedError,
  FormalizationSignaturePreviewNotReadyError,
  FormalizationVersionConflictError,
} from '../domain/errors'
import type {
  FormalizationSignatureConfigurationRepository,
  FormalizationsRepository,
} from '../interfaces'
import { FormalizationUseCase } from './formalization-use-case'

type Request = FormalizationActor & {
  readonly formalizationId: string
  readonly previewId: string
  readonly expectedVersion: number
}

export class RequestFormalizationSignaturePreviewGenerationUseCase extends FormalizationUseCase<
  Request,
  FormalizationSignatureConfiguration
> {
  constructor(
    private readonly formalizationsRepository: FormalizationsRepository,
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
    this.assertWritable(formalization)

    const configuration = await this.configurationRepository.findByFormalizationId(
      formalization.id,
    )
    if (!configuration) throw new FormalizationSignatureNotInitializedError()
    const preview = configuration.documents
      .map(({ preview }) => preview)
      .find((item) => item?.previewId === request.previewId)
    if (preview?.state !== 'failed') {
      if (preview) return configuration
      throw new FormalizationSignaturePreviewNotReadyError()
    }

    const now = this.datetimeProvider.now()
    const claim = await this.configurationRepository.schedulePendingPreview(
      request.previewId,
      now,
      {
        formalizationId: formalization.id,
        expectedFormalizationVersion: request.expectedVersion,
      },
    )
    if (!claim) throw new FormalizationVersionConflictError()

    await this.broker.publish(
      new FormalizationSignaturePreviewGenerationRequestedEvent({
        previewId: claim.previewId,
        formalizationId: formalization.id,
        attemptToken: claim.attemptToken,
        occurredAt: now.toISOString(),
      }),
    )
    return (
      (await this.configurationRepository.findByFormalizationId(formalization.id)) ??
      configuration
    )
  }
}
