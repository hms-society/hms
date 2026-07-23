export const DocumentBatchDiscardReason = {
  SpamOrUnsolicited: 'spam-or-unsolicited',
  FullyDuplicated: 'fully-duplicated',
  UnrelatedContent: 'unrelated-content',
  InvalidFiles: 'invalid-files',
  Other: 'other',
} as const

export type DocumentBatchDiscardReason =
  (typeof DocumentBatchDiscardReason)[keyof typeof DocumentBatchDiscardReason]
