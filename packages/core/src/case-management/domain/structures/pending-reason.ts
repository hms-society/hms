export const PendingReason = {
  Missing: 'missing',
  Illegible: 'illegible',
  Incomplete: 'incomplete',
  Duplicate: 'duplicate',
  NotCorresponding: 'not_corresponding',
} as const

export type PendingReason = (typeof PendingReason)[keyof typeof PendingReason]
