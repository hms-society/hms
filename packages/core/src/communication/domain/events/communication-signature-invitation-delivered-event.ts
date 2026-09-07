import { Event } from '#shared/domain/events/event'

export class CommunicationSignatureInvitationDeliveredEvent extends Event<{
  readonly version: 1
  readonly deliveryAttemptId: string
  readonly invitationId: string
  readonly communicationMessageId?: string
  readonly occurredAt: Date
  readonly outcome: 'delivered' | 'failed'
}> {
  static readonly _NAME = 'communication.signature-invitation-delivered.v1'

  constructor(
    payload: Omit<CommunicationSignatureInvitationDeliveredEvent['payload'], 'version'>,
  ) {
    super(CommunicationSignatureInvitationDeliveredEvent._NAME, {
      version: 1,
      ...payload,
    })
  }
}
