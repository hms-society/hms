import { Event } from '#shared/domain/events/event'
import type { CommunicationChannel } from '../structures'

export class MessageSentEvent extends Event<{
  messageId: string
  conversationId?: string
  attendanceId?: string
  clientId?: string
  channel: CommunicationChannel
  externalMessageId: string
  sentAt: Date
}> {
  static readonly _NAME = 'communication/message.sent'

  constructor(payload: MessageSentEvent['payload']) {
    super(MessageSentEvent._NAME, payload)
  }
}
