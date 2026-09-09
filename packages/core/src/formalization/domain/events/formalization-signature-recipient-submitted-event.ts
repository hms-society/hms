import { Event } from '#shared/domain/events/event'

export class FormalizationSignatureRecipientSubmittedEvent extends Event<{
  readonly version: 1
  readonly requestId: string
  readonly requestDocumentIds: readonly string[]
  readonly recipientId: string
  readonly providerObservationId: string
  readonly submittedAt: Date
}> {
  static readonly _NAME = 'formalization.signature-recipient-submitted.v1'

  constructor(
    payload: Omit<FormalizationSignatureRecipientSubmittedEvent['payload'], 'version'>,
  ) {
    super(FormalizationSignatureRecipientSubmittedEvent._NAME, {
      version: 1,
      ...payload,
    })
  }
}
