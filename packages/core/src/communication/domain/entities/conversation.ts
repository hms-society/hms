import type { Entity } from '#shared/domain/entities/entity'
import type { CommunicationChannel } from '../structures'

type ConversationBase = Entity & {
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
