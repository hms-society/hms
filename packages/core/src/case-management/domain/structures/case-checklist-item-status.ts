export const CaseChecklistItemStatus = {
  Pending: 'pending',
  Validated: 'validated',
} as const

export type CaseChecklistItemStatus =
  (typeof CaseChecklistItemStatus)[keyof typeof CaseChecklistItemStatus]
