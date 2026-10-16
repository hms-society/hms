import type { CaseHistoryCategory } from './case-history-category'
export type CaseHistoryQuery = {
  caseId: string
  actorId: string
  category?: CaseHistoryCategory
  search?: string
  cursor?: string
  limit?: number
}
