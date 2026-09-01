import { Event } from '#shared/domain/events/event'

export class FormalizationSignaturePreviewBatchGenerationRequestedEvent extends Event<{
  readonly formalizationId: string
  readonly items: ReadonlyArray<{
    readonly previewId: string
    readonly attemptToken: string
  }>
  readonly occurredAt: string
}> {
  static readonly _NAME = 'formalization/signature-preview.batch-generation-requested'

  constructor(
    payload: FormalizationSignaturePreviewBatchGenerationRequestedEvent['payload'],
  ) {
    super(FormalizationSignaturePreviewBatchGenerationRequestedEvent._NAME, payload)
  }
}
