export const CaseClosureEventType = {
  Closed: 'closed',
  Reopened: 'reopened',
} as const

export type CaseClosureEventType =
  (typeof CaseClosureEventType)[keyof typeof CaseClosureEventType]
