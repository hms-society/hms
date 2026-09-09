import { Event } from '#shared/domain/events/event'
import type { FormalizationSignatureArtifactKind } from '../structures'

export class FormalizationSignatureRecipientConfirmedEvent extends Event<{
  readonly version: 1
  readonly formalizationId: string
  readonly requestId: string
  readonly recipientId: string
  readonly protocol: string
  readonly confirmedAt: Date
  readonly artifacts: ReadonlyArray<{
    readonly requestDocumentId?: string
    readonly kind: FormalizationSignatureArtifactKind
    readonly privateFileId: string
    readonly sha256: string
  }>
}> {
  static readonly _NAME = 'formalization.signature-recipient-confirmed.v1'

  constructor(
    payload: Omit<FormalizationSignatureRecipientConfirmedEvent['payload'], 'version'>,
  ) {
    super(FormalizationSignatureRecipientConfirmedEvent._NAME, {
      version: 1,
      ...payload,
    })
  }
}
