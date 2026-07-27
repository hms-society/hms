import type { InternalNotificationType } from '../structures'

export type InternalNotification = {
  id: string
  type: InternalNotificationType
  recipientCollaboratorId: string
  attendanceId: string
  conversationId: string
  messagePreview?: string
  readAt?: Date
  dismissedAt?: Date
  createdAt: Date
}
