import { Event } from '#shared/domain/events/event'
import type { FormalizationSignatureChannelKind } from '../structures'

export class FormalizationSignatureInvitationReadyEvent extends Event<{
  readonly version: 1
  readonly deliveryAttemptId: string
  readonly invitationId: string
  readonly recipientId: string
  readonly personId: string
  readonly channel: FormalizationSignatureChannelKind
  readonly encryptedPayload: string
  readonly cipherKeyId: string
  readonly expiresAt: Date
  readonly correlationId: string
}> {
  static readonly _NAME = 'formalization.signature-invitation-ready.v1'

  constructor(
    payload: Omit<FormalizationSignatureInvitationReadyEvent['payload'], 'version'>,
  ) {
    super(FormalizationSignatureInvitationReadyEvent._NAME, {
      version: 1,
      ...payload,
    })
  }
}
