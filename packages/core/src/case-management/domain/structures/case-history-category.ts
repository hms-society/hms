export const CaseHistoryCategory = {
  Case: 'case',
  Team: 'team',
  Documents: 'documents',
  Waivers: 'waivers',
  Tasks: 'tasks',
  Deadlines: 'deadlines',
  Manual: 'manual',
} as const
export type CaseHistoryCategory =
  (typeof CaseHistoryCategory)[keyof typeof CaseHistoryCategory]
