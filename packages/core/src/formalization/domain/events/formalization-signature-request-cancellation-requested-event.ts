import { Event } from '#shared/domain/events/event'

export class FormalizationSignatureRequestCancellationRequestedEvent extends Event<{
  readonly version: 1
  readonly requestId: string
  readonly cancellationAttemptId: string
  readonly occurredAt: Date
  readonly correlationId: string
}> {
  static readonly _NAME = 'formalization.signature-request-cancellation-requested.v1'

  constructor(
    payload: Omit<FormalizationSignatureRequestCancellationRequestedEvent['payload'], 'version'>,
  ) {
    super(FormalizationSignatureRequestCancellationRequestedEvent._NAME, {
      version: 1,
      ...payload,
    })
  }
}
