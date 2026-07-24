import { Event } from '#shared/domain/events/event'
import type { MessageDeliveryStatus } from '../structures'

export class MessageDeliveryStatusChangedEvent extends Event<{
  messageId: string
  previousStatus: MessageDeliveryStatus
  newStatus: MessageDeliveryStatus
  changedAt: Date
}> {
  static readonly _NAME = 'communication/message.delivery-status-changed'

  constructor(payload: MessageDeliveryStatusChangedEvent['payload']) {
    super(MessageDeliveryStatusChangedEvent._NAME, payload)
  }
}
