export const MessageDeliveryStatus = {
  Received: 'received',
  Pending: 'pending',
  Sent: 'sent',
  Delivered: 'delivered',
  Read: 'read',
  Failed: 'failed',
  Bounced: 'bounced',
} as const

export type MessageDeliveryStatus =
  (typeof MessageDeliveryStatus)[keyof typeof MessageDeliveryStatus]
