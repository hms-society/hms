import { Event } from '#shared/domain/events/event'
import type { CommunicationChannel } from '../structures'

export class MessageSendingRequestedEvent extends Event<{
  messageId: string
  conversationId?: string
  attendanceId?: string
  clientId?: string
  channel: CommunicationChannel
  idempotencyKey: string
  requestedAt: Date
}> {
  static readonly _NAME = 'communication/message.sending-requested'

  constructor(payload: MessageSendingRequestedEvent['payload']) {
    super(MessageSendingRequestedEvent._NAME, payload)
  }
}
