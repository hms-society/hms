import type {
  CommunicationChannel,
  MessageDeliveryStatus,
  MessageDirection,
  MessageOrigin,
} from '../structures'

type MessageBase = {
  id: string
  direction: MessageDirection
  origin: MessageOrigin
  text?: string
  fileIds: string[]
  deliveryStatus: MessageDeliveryStatus
  externalMessageId?: string
  idempotencyKey?: string
  occurredAt: Date
  createdAt: Date
  updatedAt: Date
}

type EmailMessage = MessageBase & {
  channel: typeof CommunicationChannel.Email
  attendanceId: string
  conversationId: string
  subject: string
  inReplyTo?: string
  references: string[]
}

type WhatsappMessage = MessageBase & {
  channel: typeof CommunicationChannel.Whatsapp
  clientId?: string
  contactPhone: string
  origin: Exclude<MessageOrigin, typeof MessageOrigin.Attendant>
  attendanceId?: never
  conversationId?: never
  subject?: never
  inReplyTo?: never
  references?: never
}

export type Message = WhatsappMessage | EmailMessage
