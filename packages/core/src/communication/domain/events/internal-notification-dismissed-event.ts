import { Event } from '#shared/domain/events/event'

export class InternalNotificationDismissedEvent extends Event<{
  notificationId: string
  collaboratorId: string
  dismissedAt: Date
}> {
  static readonly _NAME = 'communication/internal-notification.dismissed'

  constructor(payload: InternalNotificationDismissedEvent['payload']) {
    super(InternalNotificationDismissedEvent._NAME, payload)
  }
}
