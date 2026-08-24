import type { Entity } from '#shared/domain/entities/entity'
import type { InternalNotificationType } from '../structures'

export type InternalNotification = Entity & {
  type: InternalNotificationType
  recipientCollaboratorId: string
  attendanceId: string
  conversationId: string
  messagePreview?: string
  readAt?: Date
  dismissedAt?: Date
  createdAt: Date
}
