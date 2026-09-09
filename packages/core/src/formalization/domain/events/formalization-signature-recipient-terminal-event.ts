import { Event } from '#shared/domain/events/event'

export class FormalizationSignatureRecipientTerminalEvent extends Event<{
  readonly version: 1
  readonly formalizationId: string
  readonly requestId: string
  readonly recipientId: string
  readonly outcome: 'rejected' | 'cancelled' | 'expired'
  readonly occurredAt: Date
}> {
  static readonly _NAME = 'formalization.signature-recipient-terminal.v1'

  constructor(
    payload: Omit<FormalizationSignatureRecipientTerminalEvent['payload'], 'version'>,
  ) {
    super(FormalizationSignatureRecipientTerminalEvent._NAME, {
      version: 1,
      ...payload,
    })
  }
}
