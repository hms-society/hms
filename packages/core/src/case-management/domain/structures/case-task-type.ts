export const CaseTaskType = {
  ProcessDeadline: 'process_deadline',
  Hearing: 'hearing',
  Publication: 'publication',
  InternalTask: 'internal_task',
  Delivery: 'delivery',
  Other: 'other',
} as const

export type CaseTaskType = (typeof CaseTaskType)[keyof typeof CaseTaskType]
