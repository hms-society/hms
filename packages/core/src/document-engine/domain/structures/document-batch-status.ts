export const DocumentBatchStatus = {
  Pending: 'pending',
  Linked: 'linked',
  Discarded: 'discarded',
} as const

export type DocumentBatchStatus =
  (typeof DocumentBatchStatus)[keyof typeof DocumentBatchStatus]
