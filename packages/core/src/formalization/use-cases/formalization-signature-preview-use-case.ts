import type { Broker } from '../../shared/interfaces'
import { FormalizationSignaturePreviewBatchGenerationRequestedEvent } from '../domain/events'
import type { FormalizationSignatureConfigurationRepository } from '../interfaces'
import { FormalizationUseCase } from './formalization-use-case'

export abstract class FormalizationSignaturePreviewUseCase<
  Request,
  Response = void,
> extends FormalizationUseCase<Request, Response> {
  protected async publishPendingPreviewBatch(
    formalizationId: string,
    previewIds: readonly string[],
    scheduledAt: Date,
    configurationRepository: FormalizationSignatureConfigurationRepository,
    broker: Broker,
  ): Promise<void> {
    const items: Array<{
      readonly previewId: string
      readonly attemptToken: string
    }> = []

    for (const previewId of previewIds) {
      const claim = await configurationRepository.schedulePendingPreview(
        previewId,
        scheduledAt,
      )
      if (claim) {
        items.push({ previewId: claim.previewId, attemptToken: claim.attemptToken })
      }
    }

    if (items.length === 0) return

    await broker.publish(
      new FormalizationSignaturePreviewBatchGenerationRequestedEvent({
        formalizationId,
        items,
        occurredAt: scheduledAt.toISOString(),
      }),
    )
  }
}
