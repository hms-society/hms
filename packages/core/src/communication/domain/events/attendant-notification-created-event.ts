import { Event } from '#shared/domain/events/event'

export class AttendantNotificationCreatedEvent extends Event<{
  notificationId: string
  attendanceId: string
  conversationId: string
  collaboratorId: string
  createdAt: Date
}> {
  static readonly _NAME = 'communication/attendant.notification-created'

  constructor(payload: AttendantNotificationCreatedEvent['payload']) {
    super(AttendantNotificationCreatedEvent._NAME, payload)
  }
}
