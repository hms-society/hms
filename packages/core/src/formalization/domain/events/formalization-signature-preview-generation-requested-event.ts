import { Event } from '#shared/domain/events/event'

export class FormalizationSignaturePreviewGenerationRequestedEvent extends Event<{
  readonly previewId: string
  readonly formalizationId: string
  readonly attemptToken: string
  readonly occurredAt: string
}> {
  static readonly _NAME = 'formalization/signature-preview.generation-requested'

  constructor(
    payload: FormalizationSignaturePreviewGenerationRequestedEvent['payload'],
  ) {
    super(FormalizationSignaturePreviewGenerationRequestedEvent._NAME, payload)
  }
}
