import type {
  Broker,
  DatetimeProvider,
  FileStorageProvider,
  UseCase,
} from '../../shared/interfaces'
import { FormalizationSignaturePreviewBatchGenerationRequestedEvent } from '../domain/events'
import type { FormalizationSignatureConfigurationRepository } from '../interfaces'

type Request = {
  readonly limit: number
}

type Response = {
  readonly scheduledPreviewIds: readonly string[]
  readonly cleanedPreviewIds: readonly string[]
}

const MAX_PREVIEWS_PER_EVENT = 100

export class ReconcileFormalizationSignaturePreviewsUseCase
  implements UseCase<Request, Response>
{
  constructor(
    private readonly configurationRepository: FormalizationSignatureConfigurationRepository,
    private readonly fileStorageProvider: FileStorageProvider,
    private readonly broker: Broker,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<Response> {
    const now = this.datetimeProvider.now()
    const [pending, expired, cleanup] = await Promise.all([
      this.configurationRepository.listPendingPreviews(request.limit),
      this.configurationRepository.listExpiredPreviews(request.limit, now),
      this.configurationRepository.listCleanupCandidates(request.limit),
    ])

    const candidates = [...pending, ...expired]
    const scheduledPreviewIds: string[] = []
    const byFormalization = new Map<
      string,
      { readonly previewId: string; readonly attemptToken: string }[]
    >()
    for (const preview of candidates) {
      const claim = await this.configurationRepository.schedulePendingPreview(
        preview.id,
        now,
      )
      if (!claim) continue
      scheduledPreviewIds.push(preview.id)
      const items = byFormalization.get(preview.formalizationId) ?? []
      items.push({ previewId: claim.previewId, attemptToken: claim.attemptToken })
      byFormalization.set(preview.formalizationId, items)
    }
    for (const [formalizationId, items] of byFormalization) {
      for (let index = 0; index < items.length; index += MAX_PREVIEWS_PER_EVENT) {
        await this.broker.publish(
          new FormalizationSignaturePreviewBatchGenerationRequestedEvent({
            formalizationId,
            items: items.slice(index, index + MAX_PREVIEWS_PER_EVENT),
            occurredAt: now.toISOString(),
          }),
        )
      }
    }

    const cleanedPreviewIds: string[] = []
    for (const candidate of cleanup) {
      await this.fileStorageProvider.remove(candidate.fileId)
      if (
        await this.configurationRepository.markCleanupComplete({
          previewId: candidate.previewId,
          fileId: candidate.fileId,
        })
      ) {
        cleanedPreviewIds.push(candidate.previewId)
      }
    }
    return { scheduledPreviewIds, cleanedPreviewIds }
  }
}
