export const DocumentVersionStatus = {
  InReview: 'in_review',
  Approved: 'approved',
  Rejected: 'rejected',
} as const

export type DocumentVersionStatus =
  (typeof DocumentVersionStatus)[keyof typeof DocumentVersionStatus]
