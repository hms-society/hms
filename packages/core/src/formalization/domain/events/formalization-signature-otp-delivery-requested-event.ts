import { Event } from '#shared/domain/events/event'
import type { FormalizationSignatureChannelKind } from '../structures'

export class FormalizationSignatureOtpDeliveryRequestedEvent extends Event<{
  readonly version: 1
  readonly deliveryAttemptId: string
  readonly invitationId: string
  readonly channel: FormalizationSignatureChannelKind
  readonly encryptedPayload: string
  readonly cipherKeyId: string
  readonly expiresAt: Date
  readonly correlationId: string
}> {
  static readonly _NAME = 'formalization.signature-otp-delivery-requested.v1'

  constructor(
    payload: Omit<FormalizationSignatureOtpDeliveryRequestedEvent['payload'], 'version'>,
  ) {
    super(FormalizationSignatureOtpDeliveryRequestedEvent._NAME, {
      version: 1,
      ...payload,
    })
  }
}
