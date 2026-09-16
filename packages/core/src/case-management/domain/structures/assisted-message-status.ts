export const AssistedMessageStatus = {
  AwaitingApproval: 'awaiting_approval',
  Approved: 'approved',
  Cancelled: 'cancelled',
} as const

export type AssistedMessageStatus =
  (typeof AssistedMessageStatus)[keyof typeof AssistedMessageStatus]
