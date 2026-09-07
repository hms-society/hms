export const CaseChecklistGateDecision = {
  Approved: 'approved',
  ApprovedWithException: 'approved_with_exception',
  BlockedInsufficient: 'blocked_insufficient',
  RejectedOnMerit: 'rejected_on_merit',
} as const

export type CaseChecklistGateDecision =
  (typeof CaseChecklistGateDecision)[keyof typeof CaseChecklistGateDecision]
