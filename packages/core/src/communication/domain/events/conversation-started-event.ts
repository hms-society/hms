import { Event } from '#shared/domain/events/event'
import type { CommunicationChannel, EmailContactEndpoint } from '../structures'

export class ConversationStartedEvent extends Event<{
  conversationId: string
  attendanceId: string
  channel: typeof CommunicationChannel.Email
  contact: EmailContactEndpoint
  startedAt: Date
}> {
  static readonly _NAME = 'communication/conversation.started'

  constructor(payload: ConversationStartedEvent['payload']) {
    super(ConversationStartedEvent._NAME, payload)
  }
}
