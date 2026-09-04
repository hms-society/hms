import { Event } from '#shared/domain/events/event'

export class CommunicationSignatureOtpDeliveredEvent extends Event<{
  readonly version: 1
  readonly deliveryAttemptId: string
  readonly providerMessageId?: string
  readonly occurredAt: Date
  readonly outcome: 'delivered' | 'failed'
}> {
  static readonly _NAME = 'communication.signature-otp-delivered.v1'

  constructor(
    payload: Omit<CommunicationSignatureOtpDeliveredEvent['payload'], 'version'>,
  ) {
    super(CommunicationSignatureOtpDeliveredEvent._NAME, {
      version: 1,
      ...payload,
    })
  }
}
