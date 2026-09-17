export const AssistedMessageStatus = {
  AwaitingApproval: 'awaiting_approval',
  Approved: 'approved',
  Sent: 'sent',
  Cancelled: 'cancelled',
} as const

export type AssistedMessageStatus =
  (typeof AssistedMessageStatus)[keyof typeof AssistedMessageStatus]
