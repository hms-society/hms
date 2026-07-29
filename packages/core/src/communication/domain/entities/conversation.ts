import type { CommunicationChannel } from '../structures'

type ConversationBase = {
  id: string
  attendanceId: string
  createdAt: Date
  updatedAt: Date
}

type EmailConversation = ConversationBase & {
  channel: typeof CommunicationChannel.Email
  contactEmail: string
  subject: string
  externalThreadId?: string
}

export type Conversation = EmailConversation
