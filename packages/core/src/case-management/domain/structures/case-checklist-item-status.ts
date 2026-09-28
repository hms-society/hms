export const CaseChecklistItemStatus = {
  Pending: 'pending',
  InAnalysis: 'in_analysis',
  Validated: 'validated',
} as const

export type CaseChecklistItemStatus =
  (typeof CaseChecklistItemStatus)[keyof typeof CaseChecklistItemStatus]
