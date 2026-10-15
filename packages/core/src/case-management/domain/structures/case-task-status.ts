export const CaseTaskStatus = {
  ToDo: 'to_do',
  InProgress: 'in_progress',
  Completed: 'completed',
} as const

export type CaseTaskStatus = (typeof CaseTaskStatus)[keyof typeof CaseTaskStatus]
