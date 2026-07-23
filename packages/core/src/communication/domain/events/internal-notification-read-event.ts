import { Event } from '#shared/domain/events/event'

export class InternalNotificationReadEvent extends Event<{
  notificationId: string
  collaboratorId: string
  readAt: Date
}> {
  static readonly _NAME = 'communication/internal-notification.read'

  constructor(payload: InternalNotificationReadEvent['payload']) {
    super(InternalNotificationReadEvent._NAME, payload)
  }
}
