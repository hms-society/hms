import { Event } from '#shared/domain/events/event'
import type { CommunicationChannel, ContactEndpoint } from '../structures'

export class MessageReceivedEvent extends Event<{
  messageId: string
  conversationId?: string
  attendanceId?: string
  clientId?: string
  channel: CommunicationChannel
  sender: ContactEndpoint
  fileIds: string[]
  receivedAt: Date
}> {
  static readonly _NAME = 'communication/message.received'

  constructor(payload: MessageReceivedEvent['payload']) {
    super(MessageReceivedEvent._NAME, payload)
  }
}
