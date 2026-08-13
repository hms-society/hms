export const DocumentReviewDecision = {
  Approved: 'approved',
  ChangesRequired: 'changes_required',
} as const

export type DocumentReviewDecision =
  (typeof DocumentReviewDecision)[keyof typeof DocumentReviewDecision]
